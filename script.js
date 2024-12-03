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
        updateSeekbar();
    });

    // Reset play/pause buttons when song ends
    audio.addEventListener("ended", () => {
        playbarPlayBtn.src = "play.svg";
        if (currentPlayingIndex !== null) {
            updatePlaylistButtons(currentPlayingIndex, "play.svg");
            currentPlayingIndex = null;
        }
    });

    // Handle seekbar drag (click and move)
    const seekbar = document.querySelector(".seekbar");
    const circle = document.querySelector(".seekbar .circle");
    
    circle.addEventListener("mousedown", (e) => {
        isPlayingFromSeekbar = true;
        const seekbarWidth = seekbar.offsetWidth;

        // Prevent text selection while dragging
        e.preventDefault();

        // Update the audio time based on the seekbar position
        document.addEventListener("mousemove", onSeekbarMouseMove);
        document.addEventListener("mouseup", onSeekbarMouseUp);

        function onSeekbarMouseMove(e) {
            if (isPlayingFromSeekbar) {
                let newX = e.clientX - seekbar.offsetLeft;
                if (newX < 0) newX = 0;
                if (newX > seekbarWidth) newX = seekbarWidth;
                circle.style.left = newX + "px";
                const seekTime = (newX / seekbarWidth) * audio.duration;
                audio.currentTime = seekTime;
            }
        }

        function onSeekbarMouseUp() {
            isPlayingFromSeekbar = false;
            document.removeEventListener("mousemove", onSeekbarMouseMove);
            document.removeEventListener("mouseup", onSeekbarMouseUp);
        }
    });

    //add an event listener for hamburger
    document.querySelector(".hamburger").addEventListener("click", ()=>{
        document.querySelector(".left").style.left = "0"
    } )

    //add event listener for close
    document.querySelector(".close").addEventListener("click", ()=>{
        document.querySelector(".left").style.left = "-120%"
    })
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

// Update the seekbar position
function updateSeekbar() {
    const seekbar = document.querySelector(".seekbar");
    const seekbarWidth = seekbar.offsetWidth;
    const percentage = (audio.currentTime / audio.duration) * 100;
    document.querySelector(".seekbar .circle").style.left = `${(percentage / 100) * seekbarWidth}px`;
}

// Format the time as MM:SS
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
}

// Parse song details from URL
function parseSongDetails(songUrl) {
    const fileName = decodeURIComponent(songUrl.split("/").pop());
    const baseName = fileName.replace(/\.mp3$/, "");
    const [artist, songName] = baseName.split(" - ");
    return { artist: artist || "Unknown Artist", name: songName || baseName };
}

// Initialize
main();
