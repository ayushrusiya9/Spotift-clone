// Existing Variables
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

// Function to update seekbar dynamically
function updateSeekbar() {
    const seekbar = document.getElementById("seekbar");
    if (audio.duration) {
        // Calculate percentage of playback progress
        const percentage = (audio.currentTime / audio.duration) * 100;
        seekbar.value = percentage; // Update the seekbar value
    }
}

// Main function
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
            <div class="info">
                <div>${artist}</div>
                <div>${name}</div>
            </div>
            <div class="playNow">
                <span>Play Now</span>
                <img class="invert playButton" data-index="${index}" src="play.svg" alt="Play Icon">
            </div>
        `;
        li.dataset.url = songUrl;
        songUL.appendChild(li);
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
            // If no song is playing, play the first song
            handlePlayPause(0, songs, null, playbarPlayBtn);
        } else {
            // Toggle play/pause for the current song
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
            const prevIndex =
                (parseInt(currentPlayingIndex) - 1 + songs.length) % songs.length;
            handlePlayPause(prevIndex, songs, null, playbarPlayBtn);
        }
    });

    // Update song time and seekbar as the song plays
    audio.addEventListener("timeupdate", () => {
        updateSongTime();
        updateSeekbar(); // Automatically updates seekbar as song progresses
    });

    // Handle manual seekbar input
    const seekbar = document.getElementById("seekbar");
    seekbar.addEventListener("input", () => {
        if (audio.duration) {
            const seekTime = (seekbar.value / 100) * audio.duration;
            audio.currentTime = seekTime; // Update playback position
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

    //add an event listener for hamburger
    document.querySelector(".hamburger").addEventListener("click", ()=> {
        document.querySelector(".left").style.left = "0";
    });

    //add event listener for close
    document.querySelector(".close").addEventListener("click", ()=> {
        document.querySelector(".left").style.left = "-120%";
    });

    // Add an event to volume
// Add event listener to volume slider for drag and touch input
document.querySelector(".range input").addEventListener("input", (e) => {
    console.log("Setting volume to", e.target.value, "/ 100");
    audio.volume = parseInt(e.target.value) / 100; // Set the audio volume

    const volumeImg = document.querySelector(".volume > img");
    if (audio.volume > 0) {
        volumeImg.src = volumeImg.src.replace("mute.svg", "volume.svg");
    } else {
        volumeImg.src = volumeImg.src.replace("volume.svg", "mute.svg");
    }
});


}

// Handle play/pause logic
function handlePlayPause(songIndex, songs, clickedButton, playbarPlayBtn) {
    const selectedSong = songs[songIndex];
    const { artist, name } = parseSongDetails(selectedSong);

    // Update the song info in the songinfo div
    document.querySelector(".songinfo").innerHTML = `
        <div><strong>Artist:</strong> ${artist}</div>
        <div><strong>Song:</strong> ${name}</div>
    `;

    if (currentPlayingIndex !== songIndex) {
        // Play new song
        audio.src = selectedSong;
        audio.play();
        currentPlayingIndex = songIndex;
        playbarPlayBtn.src = "pause.svg";
        updatePlaylistButtons(songIndex, "pause.svg");

        if (clickedButton) {
            updatePlaylistButtons(null, "play.svg"); // Reset all other buttons
            clickedButton.src = "pause.svg";
        }
    } else {
        // Toggle play/pause for the same song
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

// Update the song time on the playbar
function updateSongTime() {
    const currentTime = formatTime(audio.currentTime);
    const duration = formatTime(audio.duration);
    document.querySelector(".songtime").textContent = `${currentTime} / ${duration}`;
}

// Parse song details from URL
function parseSongDetails(songUrl) {
    const fileName = decodeURIComponent(songUrl.split("/").pop());
    const baseName = fileName.replace(/\.mp3$/, "");
    const [artist, songName] = baseName.split(" - ");
    return { artist: artist || "Unknown Artist", name: songName || baseName };
}

// Format the time as MM:SS
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
}

// Initialize
main();
