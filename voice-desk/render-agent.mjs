// Clooney's render agent: asks the Qontent Tube Voice Desk (HAPI A2A, read-only)
// whether a voiceover is ready, then downloads the ready clips for the edit.
//
//   VOICE_DESK_URL   HAPI server with --a2a        (default http://localhost:3000)
//   QONTENT_TUBE_URL Qontent Tube API for the WAVs (default http://127.0.0.1:8787)
//   PROJECT          project name to follow        (default "Qontent Tube Voice Desk")
//   OUT_DIR          where to save clips           (default ./clips)
import { mkdir, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { ClientFactory } from '@a2a-js/sdk/client';
import { Role } from '@a2a-js/sdk';

const deskUrl = process.env.VOICE_DESK_URL ?? 'http://localhost:3000';
const qtUrl = process.env.QONTENT_TUBE_URL ?? 'http://127.0.0.1:8787';
const projectName = process.env.PROJECT ?? 'Qontent Tube Voice Desk';
const outDir = process.env.OUT_DIR ?? './clips';

// 1. Discover the agent from its public Agent Card.
const client = await new ClientFactory().createFromUrl(deskUrl);
const card = await client.getAgentCard();
console.log(`Agent: ${card.name} (A2A ${client.protocolVersion})`);
console.log(`Skills: ${card.skills.map((s) => s.id).join(', ')}`);

// 2. HAPI invokes a skill only from one structured data part: { hapi: { skillId, arguments } }.
async function ask(skillId, args = {}) {
  const result = await client.sendMessage({
    message: {
      messageId: randomUUID(),
      role: Role.ROLE_USER,
      parts: [{ content: { $case: 'data', value: { hapi: { skillId, arguments: args } } } }],
    },
  });
  const message = result.payload?.value ?? result;
  const data = message.parts?.find((p) => p.content?.$case === 'data')?.content.value;
  if (!data?.hapi?.result) throw new Error(`${skillId}: ${JSON.stringify(message.parts ?? result)}`);
  return data.hapi.result.structuredContent;
}

// 3. Follow the voiceover: project → script → manifest.
const project = (await ask('listProjects')).find((p) => p.name === projectName);
if (!project) throw new Error(`Project not found: ${projectName}`);
const [script] = await ask('listScripts', { projectId: project.id });
const manifest = await ask('getAudioManifest', { scriptId: script.id });
const ready = manifest.clips.filter((c) => c.status === 'ready');
console.log(`"${script.title}" r${manifest.revision}: ${ready.length} of ${manifest.clips.length} clips ready`);

// 4. Download the ready clips straight from Qontent Tube (HAPI returns their URLs).
await mkdir(outDir, { recursive: true });
for (const clip of ready) {
  const wav = Buffer.from(await (await fetch(new URL(clip.audioUrl, qtUrl))).arrayBuffer());
  const file = `${outDir}/${clip.segmentId}.wav`;
  await writeFile(file, wav);
  console.log(`  saved ${file} (${(clip.durationMs / 1000).toFixed(1)} s)`);
}

// 5. Prove the boundary: the desk will not spend voice credits for us.
try {
  await ask('generateSegmentAudio', { scriptId: script.id });
} catch (error) {
  console.log(`generateSegmentAudio refused: ${error.message.split('\n')[0].slice(0, 120)}`);
}
