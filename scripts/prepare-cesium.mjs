import { cp, mkdir, readFile, stat } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import process from 'node:process';

export async function prepareCesium() {
  for (const folder of ['Workers', 'Assets', 'Widgets', 'ThirdParty']) {
    await mkdir('assets/cesium', { recursive: true });
    await cp(
      `node_modules/cesium/Build/Cesium/${folder}`,
      `assets/cesium/${folder}`,
      {
        recursive: true,
        filter: async (source, destination) => {
          if (!(await stat(source)).isFile()) return true;
          try {
            const [original, existing] = await Promise.all([
              readFile(source),
              readFile(destination),
            ]);
            return !original.equals(existing);
          } catch (error) {
            if (error.code === 'ENOENT') return true;
            throw error;
          }
        },
      },
    );
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  await prepareCesium();
  console.log('Cesium runtime assets prepared locally.');
}
