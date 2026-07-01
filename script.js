const playBtn = document.querySelector("#play-btn");
const pauseBtn = document.querySelector("#pause-btn");
const songTitle = document.querySelector("#song-title");
const artistName = document.querySelector("#artist-name");

playBtn.addEventListener("click", function () {
  songTitle.textContent = "Playing Music";
  artistName.textContent = "My First Web App";
});

pauseBtn.addEventListener("click", function () {
  songTitle.textContent = "Paused";
  artistName.textContent = "Music stopped";
});