const socket = io();

// store your own marker separately
let myMarker;

// map setup
const map = L.map("map").setView([0, 0], 2);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "OpenStreetMap contributors",
}).addTo(map);

const markers = {};

if (navigator.geolocation) {
  navigator.geolocation.watchPosition(
    (position) => {
      const { latitude, longitude } = position.coords;

      // send your location to server
      socket.emit("send-location", { latitude, longitude });

      // update your own marker immediately
      if (myMarker) {
        myMarker.setLatLng([latitude, longitude]);
      } else {
        myMarker = L.marker([latitude, longitude], { title: "Me" }).addTo(map);
        map.setView([latitude, longitude], 15); // center once when first location is found
      }
    },
    (error) => {
      console.error("Geolocation error:", error);
    },
    {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 5000,
    }
  );
}

// listen for other users' locations
socket.on("receive-location", (data) => {
  const { id, latitude, longitude } = data;

  // skip updating your own marker again
  if (id === socket.id) return;

  if (markers[id]) {
    markers[id].setLatLng([latitude, longitude]);
  } else {
    markers[id] = L.marker([latitude, longitude], {
      title: `User ${id}`,
    }).addTo(map);
  }
});

// remove marker when user disconnects
socket.on("user-disconnected", (id) => {
  if (markers[id]) {
    map.removeLayer(markers[id]);
    delete markers[id];
  }
});
