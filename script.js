// // console.log("Let's write a code");

// async function getsongs() {
//     try{
//         // Fetch the directory contents
//         let a = await fetch("http://127.0.0.1:5500/songs/");
//         let response = await a.text();

//         // Parse the directory contents
//         let div = document.createElement("div");
//         div.innerHTML = response;
//         let as = div.getElementsByTagName("a");

//         let songs = [];
//         for (let index = 0; index < as.length; index++) {
//             const element = as[index];
//             if (element.href.endsWith(".mp3")) {
//                 songs.push(element.href); // Store song URL in the array
//             }
//         }

//         // Save to sessionStorage
//         sessionStorage.setItem("songs", JSON.stringify(songs));
//         console.log("Songs:", songs);
//     } catch (error) {
//         console.error("Error fetching songs:", error);
//     }
// }

// async function main(){
//     //get the song of all songs
//     let songs = await getsongs()
//     console.log(songs); 
    
//     let songUL = document.querySelector(".songList").getElementsByTagName("ul")[0]
//     for (const song of songs) {
//        songUL.innerHTML = songUL.innerHTML + song
//     }

//     //songs the first song
//     var audio = new Audio(songs[0]);
//     audio.play();

//     audio.addEventListener("ontimeupdate",() => {
//         let duration = audio.duration;
//         console.log(duration)
//         //the duration variable now holds the duration (in second ) of the audio clip
//     });
// }
// main()

// getsongs();

console.log("Let's write a code");

async function getsongs() {
    try {
        // Fetch the directory contents
        let a = await fetch("http://127.0.0.1:5500/songs/");
        let response = await a.text();

        // Parse the directory contents
        let div = document.createElement("div");
        div.innerHTML = response;
        let as = div.getElementsByTagName("a");

        let songs = [];
        for (let index = 0; index < as.length; index++) {
            const element = as[index];
            if (element.href.endsWith(".mp3")) {
                songs.push(element.href); // Store song URL in the array
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
    songUL.innerHTML = ""; // Clear existing content
    songs.forEach((song, index) => {
        let li = document.createElement("li");
        
        // Decode the song name and remove path
        let songName = decodeURIComponent(song.split("/").pop());
        li.textContent = `${index + 1}. ${songName}`; // Add numbering to each song
        li.dataset.url = song; // Store the song URL in a custom attribute
        songUL.appendChild(li);
    });

    // Play the first song
    var audio = new Audio(songs[0]);
    audio.play();

    // Update duration on time update
    audio.addEventListener("timeupdate", () => {
        let duration = audio.duration;
        console.log("Duration (seconds):", duration);
    });

    // Handle song click to play
    songUL.addEventListener("click", (e) => {
        if (e.target.tagName === "LI") {
            let songURL = e.target.dataset.url;
            audio.src = songURL;
            audio.play();
        }
    });
}


getsongs()
main();
