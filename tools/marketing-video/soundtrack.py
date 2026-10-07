"""Original, deterministic 30-second ambient score. No sampled or licensed music."""
from pathlib import Path
import wave
import numpy as np

RATE = 48000
DURATION = 30
rng = np.random.default_rng(1047)
time = np.arange(RATE * DURATION, dtype=np.float64) / RATE
left = np.zeros_like(time)
right = np.zeros_like(time)

# A quiet open fifth with a slowly changing minor color.
for frequency, level in [(55, .11), (110, .047), (164.8138, .04), (220, .019), (261.626, .012)]:
    shimmer = .75 + .25 * np.sin(2 * np.pi * .09 * time + frequency)
    left += level * shimmer * (np.sin(2 * np.pi * frequency * time) + .2 * np.sin(2 * np.pi * frequency * 1.003 * time))
    right += level * shimmer * (np.sin(2 * np.pi * frequency * time + .13) + .2 * np.sin(2 * np.pi * frequency * .997 * time))

# Sparse glassy arpeggios create pace without competing with the typography.
notes = [220, 329.6276, 440, 523.2511, 659.2551, 440, 329.6276, 261.6256]
for index, start in enumerate(np.arange(1.5, 27.8, .75)):
    local = np.maximum(0, time - start)
    envelope = (time >= start) * np.minimum(local / .018, 1) * np.exp(-local * 3.2)
    frequency = notes[index % len(notes)]
    tone = (np.sin(2 * np.pi * frequency * local) + .22 * np.sin(2 * np.pi * frequency * 2.003 * local)) * envelope * .047
    pan = .35 + .3 * ((index % 4) / 3)
    left += tone * np.sqrt(1 - pan)
    right += tone * np.sqrt(pan)
    # One restrained, short echo preserves space.
    delay = int(RATE * .19)
    left[delay:] += tone[:-delay] * .12
    right[delay:] += tone[:-delay] * .15

# Low pulses and airy camera transitions are synthesized from scratch.
for start in np.arange(4.2, 25, 1.5):
    local = np.maximum(0, time - start)
    envelope = (time >= start) * np.minimum(local / .008, 1) * np.exp(-local * 9)
    pulse = np.sin(2 * np.pi * (49 * local + 1.5 * (1 - np.exp(-local * 25)))) * envelope * .09
    left += pulse
    right += pulse
noise = rng.normal(0, 1, len(time))
noise = np.convolve(noise, np.ones(15) / 15, mode='same')
for start in [3.65, 8.95, 14.6, 20.05, 24.7]:
    envelope = np.exp(-((time - (start + .25)) / .42) ** 2)
    swoosh = noise * envelope * .032
    left += swoosh
    right += np.roll(swoosh, 290)

fade = np.minimum(time / 1.5, 1) * np.minimum((DURATION - time) / 1.65, 1)
stereo = np.stack([left * fade, right * fade], axis=1)
# The score intentionally sits low; normalized peak is -9.1 dBFS.
stereo *= .35 / np.max(np.abs(stereo))
destination = Path('test-results/marketing-video/soundtrack.wav')
destination.parent.mkdir(parents=True, exist_ok=True)
with wave.open(str(destination), 'wb') as output:
    output.setnchannels(2)
    output.setsampwidth(2)
    output.setframerate(RATE)
    output.writeframes((stereo * 32767).astype('<i2').tobytes())
print(f'Created original stereo score: {destination} ({DURATION}s, {RATE}Hz, peak -9.1dBFS)')
