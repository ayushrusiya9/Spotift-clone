let audio = new Audio();
let currentPlayingIndex = null;
let isPlayingFromSeekbar = false;

// Fetch the songs dynamically
async function getsongs() {
    try {
        const response = await fetch("http://127.0.0.1:5500/songs/");
        const text = await response.text();
        const div = document.createElement("div");
        div.innerHTML = text;
        const links = div.getElementsByTagName("a");

        let songs = [];
        for (let link of links) {
            if (link.href.endsWith(".mp3")) {
                songs.push(link.href);
            }
        }
        sessionStorage.setItem("songs", JSON.stringify(songs));
        return songs;
    } catch (error) {
        console.error("Error fetching songs:", error);
        return [];
    }
}

async function main() {
    const songs = await getsongs();
    if (songs.length === 0) {
        console.error("No songs found!");
        return;
    }

    const songUL = document.querySelector(".songList ul");
    const playbarPlayBtn = document.getElementById("play");
    const playbarPrevBtn = document.getElementById("previous");
    const playbarNextBtn = document.getElementById("next");

    // Populate song list
    songs.forEach((songUrl, index) => {
        const li = document.createElement("li");
        const { artist, name } = parseSongDetails(songUrl);

        li.innerHTML = `
            <img class="invert" src="music.svg" alt="Music Icon">
            <div class="info songinfo">
                <div>${artist}</div>
                <div>${name}</div>
            </div>
            <div class="songtime">00:00</div>
            <div class="playNow">
                <span>Play Now</span>
                <img class="invert playButton" data-index="${index}" src="play.svg" alt="Play Icon">
            </div>
        `;
        li.dataset.url = songUrl;
        songUL.appendChild(li);

        // Get song duration and update time display
        const tempAudio = new Audio(songUrl);
        tempAudio.addEventListener("loadedmetadata", () => {
            const duration = formatTime(tempAudio.duration);
            li.querySelector(".songtime").innerText = duration;
        });
    });

    // Handle song list click (play/pause)
    songUL.addEventListener("click", (e) => {
        const playButton = e.target.closest(".playButton");
        if (playButton) {
            const songIndex = playButton.dataset.index;
            handlePlayPause(songIndex, songs, playButton, playbarPlayBtn);
        }
    });

    // Handle playbar Play/Pause button
    playbarPlayBtn.addEventListener("click", () => {
        if (currentPlayingIndex === null) {
            handlePlayPause(0, songs, null, playbarPlayBtn);
        } else {
            if (audio.paused) {
                audio.play();
                playbarPlayBtn.src = "pause.svg";
                updatePlaylistButtons(currentPlayingIndex, "pause.svg");
            } else {
                audio.pause();
                playbarPlayBtn.src = "play.svg";
                updatePlaylistButtons(currentPlayingIndex, "play.svg");
            }
        }
    });

    // Handle Next button
    playbarNextBtn.addEventListener("click", () => {
        if (currentPlayingIndex !== null) {
            const nextIndex = (parseInt(currentPlayingIndex) + 1) % songs.length;
            handlePlayPause(nextIndex, songs, null, playbarPlayBtn);
        }
    });

    // Handle Previous button
    playbarPrevBtn.addEventListener("click", () => {
        if (currentPlayingIndex !== null) {
            const prevIndex = (parseInt(currentPlayingIndex) - 1 + songs.length) % songs.length;
            handlePlayPause(prevIndex, songs, null, playbarPlayBtn);
        }
    });

    // Reset play/pause buttons when song ends
    audio.addEventListener("ended", () => {
        playbarPlayBtn.src = "play.svg";
        if (currentPlayingIndex !== null) {
            updatePlaylistButtons(currentPlayingIndex, "play.svg");
            currentPlayingIndex = null;
        }
    });
}

// Handle play/pause logic
function handlePlayPause(songIndex, songs, clickedButton, playbarPlayBtn) {
    const selectedSong = songs[songIndex];
    if (currentPlayingIndex !== songIndex) {
        audio.src = selectedSong;
        audio.play();
        currentPlayingIndex = songIndex;
        playbarPlayBtn.src = "pause.svg";
        updatePlaylistButtons(songIndex, "pause.svg");

        if (clickedButton) {
            updatePlaylistButtons(null, "play.svg");
            clickedButton.src = "pause.svg";
        }
    } else {
        if (audio.paused) {
            audio.play();
            playbarPlayBtn.src = "pause.svg";
            updatePlaylistButtons(songIndex, "pause.svg");
        } else {
            audio.pause();
            playbarPlayBtn.src = "play.svg";
            updatePlaylistButtons(songIndex, "play.svg");
        }
    }
}

// Update all playlist buttons
function updatePlaylistButtons(activeIndex, icon) {
    document.querySelectorAll(".playButton").forEach((btn, index) => {
        if (activeIndex === null || index !== parseInt(activeIndex)) {
            btn.src = "play.svg";
        } else {
            btn.src = icon;
        }
    });
}

// Parse song details from URL
function parseSongDetails(songUrl) {
    const fileName = decodeURIComponent(songUrl.split("/").pop());
    const baseName = fileName.replace(/\.mp3$/, "");
    const [artist, songName] = baseName.split(" - ");
    return { artist: artist || "Unknown Artist", name: songName || baseName };
}

// Format time in MM:SS
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

// Initialize
main();
