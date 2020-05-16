// Retrieve video and button tags from dom
const local_video = document.getElementById("local-video");
const remote_video = document.getElementById("remote-video");
const join_button = document.getElementById("join-button");
const leave_button = document.getElementById("leave-button");

// Set callback functions for when the buttons are clicked
join_button.onclick = joinCall;
leave_button.onclick = leaveCall;

// Other global variables
let local_stream;
let signalingSocket;
let pc;

// Configuration
// const stream_config = { audio: true, video: { width: 320, height: 240 } }
const stream_config = { audio: true, video: true };
const socket_address = "wss://" + window.location.host;
// const ice_config = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };
const ice_config = { iceServers: [{ urls: "stun:51.255.46.225:3478" }] };

// INIT ##############################################################

// Disable buttons for now
join_button.disabled = true;
leave_button.disabled = true;

// Activate local camera stream
navigator.mediaDevices
  .getUserMedia(stream_config)
  // Cannot use "await" at top level
  .then((stream) => (local_stream = stream))
  .then(() => (local_video.srcObject = local_stream))
  .then(() => (join_button.disabled = false))
  .then(initSignalingAndPC)
  .catch((error) => console.log(error));

function initSignalingAndPC() {
  // Setup signaling and peer connection.
  signalingSocket = new SignalingSocket(socket_address);
  signalingSocket.onRemotePeerConnected = (chan, polite) => {
    console.log("Peer connected", chan.remotePeerId);
    pc = new PeerConnection(ice_config, chan, polite);
    pc.onRemoteTrack = (streams) => {
      remote_video.srcObject = streams[0];
    };
    pc.setLocalStream(local_stream);
  };
  signalingSocket.onRemotePeerDisconnected = (remotePeerId) => {
    pc.close();
    pc = null;
    remote_video.srcObject = null;
  };
}

// JOIN ##############################################################

function joinCall() {
  join_button.disabled = true;
  leave_button.disabled = false;
  signalingSocket.join();
}

// LEAVE #############################################################

function leaveCall() {
  join_button.disabled = false;
  leave_button.disabled = true;
  signalingSocket.leave();
  if (pc != null) {
    pc.close();
    pc = null;
  }
  remote_video.srcObject = null;
}
