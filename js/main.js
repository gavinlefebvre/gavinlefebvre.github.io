/*
 *  Copyright (c) 2015 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */

"use strict";

const videoElement = document.querySelector("video");
const audioInputSelect = document.querySelector("select#audioSource");
const audioOutputSelect = document.querySelector("select#audioOutput");
const videoSelect = document.querySelector("select#videoSource");
const selectors = [audioInputSelect, audioOutputSelect, videoSelect];
var timeOutFunc

audioOutputSelect.disabled = !("sinkId" in HTMLMediaElement.prototype);

function findDevices(initial) {
	navigator.mediaDevices.enumerateDevices().then(gotDevices).catch(handleError);
	var updateDiv = document.getElementById("update")
	updateDiv.classList.remove('hidden')
	timeOutFunc = setTimeout(function() {updateDiv.classList.add('hidden') } , 3000);
}

function gotDevices(deviceInfos) {
	// Handles being called several times to update labels. Preserve values.
	const values = selectors.map((select) => select.value);
	// But, also check for empty values
	for(let i=0; i=1; i++) {
		if(!values[i]) {
			values[i] = 'communication'
		}
	}
	selectors.forEach((select) => {
		while (select.firstChild) {
			select.removeChild(select.firstChild);
		}
	});
	for (let i = 0; i !== deviceInfos.length; ++i) {
		const deviceInfo = deviceInfos[i];
		const option = document.createElement("option");
		option.value = deviceInfo.deviceId;
		if (deviceInfo.kind === "audioinput") {
			option.text =
				deviceInfo.label || `microphone ${audioInputSelect.length + 1}`;
			audioInputSelect.appendChild(option);
			// if(option.text.toLowerCase().includes("bluetooth")) {
			// 	values[0] = deviceInfo.deviceId
			// }
		} else if (deviceInfo.kind === "audiooutput") {
			option.text =
				deviceInfo.label || `speaker ${audioOutputSelect.length + 1}`;
			audioOutputSelect.appendChild(option);
			// if(option.text.toLowerCase().includes("bluetooth")) {
			// 	values[1] = deviceInfo.deviceId	
			// }			
		} else if (deviceInfo.kind === "videoinput") {
			option.text = deviceInfo.label || `camera ${videoSelect.length + 1}`;
			videoSelect.appendChild(option);
		} else {
			console.log("Some other kind of source/device: ", deviceInfo);
		}
	}
	selectors.forEach((select, selectorIndex) => {
		if (
			Array.prototype.slice
				.call(select.childNodes)
				.some((n) => n.value === values[selectorIndex])
		) {
			select.value = values[selectorIndex];
		}
	});
}

// Request labels by requesting user device
function activateDevice(dev) {
	// pass
}

findDevices()

navigator.mediaDevices.ondevicechange = findDevices

// Attach audio output device to video element using device/sink ID.
function attachSinkId(element, sinkId) {
	if (typeof element.sinkId !== "undefined") {
		element
			.setSinkId(sinkId)
			.then(() => {
				console.log(`Success, audio output device attached: ${sinkId}`);
			})
			.catch((error) => {
				let errorMessage = error;
				if (error.name === "SecurityError") {
					errorMessage = `You need to use HTTPS for selecting audio output device: ${error}`;
				}
				console.error(errorMessage);
				// Jump back to first output device in the list as it's the default.
				audioOutputSelect.selectedIndex = 0;
			});
	} else {
		console.warn("Browser does not support output device selection.");
	}
}

function changeAudioDestination() {
	const audioDestination = audioOutputSelect.value;
	document.cookie = "speaker=" + audioDestination;
	attachSinkId(videoElement, audioDestination);
}

function changeAudioSource() {
	if(audioInputSelect.value) {
		document.cookie = "mic=" + audioInputSelect.value;
	}
	start()
}

function changeVideoSource() {
	if(videoSelect.value) {
		document.cookie = "camera=" + videoSelect.value;
	}
	start();
}

function gotStream(stream) {
	window.stream = stream; // make stream available to console
	videoElement.srcObject = stream;
	// Refresh button list in case labels have become available
	return navigator.mediaDevices.enumerateDevices();
}

function handleError(error) {
	console.log(
		"navigator.MediaDevices.getUserMedia error: ",
		error.message,
		error.name
	);
}

function start() {
	if (window.stream) {
		window.stream.getTracks().forEach((track) => {
			track.stop();
		});
	}
	const audioSource = audioInputSelect.value;
	const videoSource = videoSelect.value;
	const constraints = {
		audio: { deviceId: audioSource ? { exact: audioSource } : undefined },
		video: { deviceId: videoSource ? { exact: videoSource } : undefined },
	};
	navigator.mediaDevices
		.getUserMedia(constraints)
		.then(gotStream)
		.then(gotDevices)
		.catch(handleError);
}

audioInputSelect.onchange = changeAudioSource;
audioOutputSelect.onchange = changeAudioDestination;

videoSelect.onchange = changeVideoSource;

start();
