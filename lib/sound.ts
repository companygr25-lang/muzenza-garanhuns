export function playNotificationSound() {
  if (typeof window === 'undefined') return;
  try {
    const audio = new Audio("https://www.image2url.com/r2/default/audio/1779643438140-5768f505-6746-43a6-bc97-5162d73af79a.mp3");
    audio.volume = 0.55;
    audio.play().catch(err => {
      console.log("Audio play blocked or needs interface interaction:", err);
    });
  } catch (error) {
    console.error("Failed to play notification sound:", error);
  }
}
