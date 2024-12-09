document.addEventListener("DOMContentLoaded", onReady);

const filePath = "./resources/samples/37-audio/";

const files = [
    { name: "Flutes", file: "track-9.ogg", gain: 0.6 },
    { name: "Oboes", file: "track-10.ogg", gain: 0.5 },
    { name: "English Horn", file: "track-11.ogg", gain: 0.6 },
    { name: "Clarinets", file: "track-12.ogg", gain: 0.6 },
    { name: "Bass Clarinet", file: "track-13.ogg", gain: 0.4 },
    { name: "Bassoons", file: "track-14.ogg", gain: 0.4 },
    { name: "Double Bassoon", file: "track-15.ogg", gain: 0.4 },
    { name: "Horns", file: "track-6.ogg", gain: 0.6 },
    { name: "Trumpets", file: "track-8.ogg", gain: 0.4 },
    { name: "Trombones", file: "track-7.ogg", gain: 0.5 },
    { name: "Timpani", file: "track-18.ogg", gain: 0.2 },
    { name: "Cymbal", file: "track-17.ogg", gain: 0.9 },
    { name: "Bass Drum", file: "track-16.ogg", gain: 0.9 },
    { name: "Organ", file: "track-19.ogg", gain: 0.2 },
    { name: "Violin I", file: "track-1.ogg", gain: 0.4 },
    { name: "Violin II", file: "track-2.ogg", gain: 0.4 },
    { name: "Viola", file: "track-3.ogg", gain: 0.2 },
    { name: "Cello", file: "track-4.ogg", gain: 0.15 },
    { name: "Contrabass", file: "track-5.ogg", gain: 0.1 },
];

const tracks = [];

async function onReady() {
    const tbody = document.getElementById("mixerBody");

    for (const f of files) {
        const t = new AudioTrack(f);

        tracks.push(t);

        const tr = document.createElement("tr");
        const title = document.createElement("td");
        title.innerHTML = f.name;

        const soloCol = document.createElement("td");
        const soloInput = document.createElement("input");
        soloInput.setAttribute("role", "switch");
        soloInput.setAttribute("type", "checkbox");
        soloInput.addEventListener("change", (event) => {
            t.setSolo(event.target.checked);
            applySoloAndMute();
        });
        soloCol.appendChild(soloInput);

        const muteCol = document.createElement("td");
        const muteInput = document.createElement("input");
        muteInput.setAttribute("role", "switch");
        muteInput.setAttribute("type", "checkbox");
        muteInput.addEventListener("change", (event) => {
            t.setMuted(event.target.checked);
            applySoloAndMute();
        });
        muteCol.appendChild(muteInput);

        const volumeCol = document.createElement("td");
        const volumeInput = document.createElement("input");
        volumeInput.setAttribute("type", "range");
        volumeInput.setAttribute("min", 0);
        volumeInput.setAttribute("max", 150);
        volumeInput.setAttribute("value", t.gainValue * 100);
        volumeInput.addEventListener("change", (event) => {
            t.setGain(parseInt(event.target.value) / 100.0, false);
        });
        volumeCol.appendChild(volumeInput);

        tr.appendChild(title);
        tr.appendChild(soloCol);
        tr.appendChild(muteCol);
        tr.appendChild(volumeCol);

        tbody.appendChild(tr);
    }
}

class AudioTrack {
    constructor(f) {
        this.title = f.title;
        this.file = f.file;
        this.gainValue = f.gain;
        this.solo = false;
        this.muted = false;
    }

    async loadFile(context) {
        const ret = await fetch(filePath + this.file);
        const binary = await ret.arrayBuffer();

        const data = await context.decodeAudioData(binary);
        this.buffer = context.createBufferSource();
        this.buffer.buffer = data;

        this.gain = context.createGain();
        this.setGain(this.gainValue);

        this.buffer.connect(this.gain).connect(context.destination);
    }

    start(time, offset) {
        if (this.buffer != null) {
            this.buffer.start(time, offset);
        }
    }

    stop() {
        if (this.buffer != null) {
            this.buffer.stop();
        }
    }

    close() {
        this.gain.disconnect();
        this.buffer.disconnect();
        this.gain = null;
        this.buffer = null;
    }

    setGain(value, anySolo) {
        if (value != null) {
            this.gainValue = value;
        }
        if (this.gain != null) {
            if ((anySolo && this.solo === false) || this.muted === true) {
                this.gain.gain.value = 0;
            } else {
                this.gain.gain.value = this.gainValue;
            }
        }
    }

    setSolo(boolValue) {
        this.solo = boolValue;
    }

    setMuted(boolValue) {
        this.muted = boolValue;
    }
}

async function play() {
    const playButton = document.getElementById("playButton");
    const stopButton = document.getElementById("stopButton");

    playButton.setAttribute("disabled", true);

    const context = new AudioContext({
        sampleRate: 48000,
    });

    let i = 0;
    const n = tracks.length;

    for (const t of tracks) {
        await t.loadFile(context);

        t.buffer.addEventListener("ended", () => {
            // Race condition?
            i++;

            t.close();

            if (i >= n) {
                context.close();
                playButton.removeAttribute("disabled");
                stopButton.setAttribute("disabled", true);
            }
        });
    }

    applySoloAndMute();

    const DELTA = 0.2; // 200 ms
    const startTime = context.currentTime + DELTA;

    for (const t of tracks) {
        t.start(startTime, 1);
    }
    stopButton.removeAttribute("disabled");
}

function stop() {
    const stopButton = document.getElementById("stopButton");

    for (const t of tracks) {
        t.stop();
    }

    stopButton.setAttribute("disabled", true);
}

function applySoloAndMute() {
    const anySolo = tracks.find((t) => t.solo === true) != null;

    for (const t of tracks) {
        t.setGain(null, anySolo);
    }
}
