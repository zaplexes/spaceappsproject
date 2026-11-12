import { cp, mkdir } from 'node:fs/promises';
for (const folder of ['Workers', 'Assets', 'Widgets', 'ThirdParty']) {
  await mkdir('assets/cesium', { recursive: true });
  await cp(
    `node_modules/cesium/Build/Cesium/${folder}`,
    `assets/cesium/${folder}`,
    { recursive: true },
  );
}
console.log('Cesium runtime assets prepared locally.');
