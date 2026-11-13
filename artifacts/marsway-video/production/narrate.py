import asyncio
from pathlib import Path
import edge_tts

ROOT = Path(__file__).resolve().parents[1]
LINES = [
    'Where should astronauts explore next on Mars?',
    'Marsway brings NASA imagery and scientific evidence into one workspace.',
    'Compare destinations, distances, and scores. Adjust your study interests.',
    'Inspect the evidence. Terrain suitability stays unknown.',
    'Plan a round trip from your simulated base. Distance estimates, not verified routes.',
    'Marsway. Explore with evidence.',
]

async def main():
    for index, text in enumerate(LINES):
        rate = '+8%' if index == 2 else '+3%'
        await edge_tts.Communicate(text, 'en-US-GuyNeural', rate=rate).save(
            str(ROOT / 'audio' / f'voice-{index}.mp3')
        )
        print(index, text, flush=True)

asyncio.run(main())
