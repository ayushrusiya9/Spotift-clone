console.log("Let's write a code");

async function getsongs() {
    try {
        // Fetch the directory contents
        let response = await fetch("http://127.0.0.1:5500/songs/");
        let text = await response.text();

        // Parse the directory contents
        let div = document.createElement("div");
        div.innerHTML = text;
        let links = div.getElementsByTagName("a");

        let songs = [];
        for (let link of links) {
            if (link.href.endsWith(".mp3")) {
                songs.push(link.href); // Store song URL in the array
            }
        }

        // Save to sessionStorage
        sessionStorage.setItem("songs", JSON.stringify(songs));
        console.log("Songs:", songs);
        return songs; // Return the songs array
    } catch (error) {
        console.error("Error fetching songs:", error);
        return []; // Return an empty array in case of an error
    }
}

function parseSongDetails(songUrl) {
    // Extract the file name from the URL
    let fileName = decodeURIComponent(songUrl.split("/").pop());

    // Remove the file extension
    let baseName = fileName.replace(/\.mp3$/, "");

    // Split into artist and song title (assuming "Artist - Song.mp3" format)
    let [artist, songName] = baseName.split(" - ");

    return {
        artist: artist || "Unknown Artist",
        name: songName || baseName
    };
}

async function main() {
    // Get all songs
    let songs = await getsongs(); // Ensure we wait for the songs to load

    if (songs.length === 0) {
        console.error("No songs found!");
        return;
    }

    // Get the song list container
    let songUL = document.querySelector(".songList ul");
    if (!songUL) {
        console.error("Song list container not found!");
        return;
    }

    // Add songs to the song list
    songs.forEach((songUrl) => {
        let li = document.createElement("li");

        // Parse song details
        let { name, artist } = parseSongDetails(songUrl);

        // Build the song list item
        li.innerHTML = `
            <img class="invert" src="music.svg" alt="Music Icon">
            <div class="info">
                <div>${artist}</div>
                <div>${name}</div>
            </div>
            <div class="playNow">
                <span>Play Now</span>
                <img class="invert" src="play.svg" alt="Play Icon">
            </div>
        `;
        li.dataset.url = songUrl; // Store the song URL in a custom attribute
        songUL.appendChild(li);
    });

    // Play the first song
    let audio = new Audio(songs[0]);
    audio.play();

    // Update duration on time update
    audio.addEventListener("timeupdate", () => {
        console.log("Current Time:", audio.currentTime);
        console.log("Duration:", audio.duration);
    });

    // Handle song click to play
    songUL.addEventListener("click", (e) => {
        let target = e.target.closest("li");
        if (target) {
            let songURL = target.dataset.url;
            audio.src = songURL;
            audio.play();
        }
    });
}

main();

