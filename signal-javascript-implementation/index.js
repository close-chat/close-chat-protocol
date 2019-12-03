'use strict';

const ls = window.libsignal;
const store = new window.SignalProtocolStore();

const KeyHelper = ls.KeyHelper;
const numberOfPreKeys = 2;
const serverBaseUrl = window.location.href;

let idKeyPair = {};
let registrationId;
let deviceId = 123;
let preKeyObjects = [];
let preKeyObjectsToSend = [];
let signedPreKeyObject = {};

const rawMessageStr = "The future is CLOS3"
let myIdentifiers = {};
let myContacts = {};

// List element to display saved contacts
let contacts = []

document.addEventListener('DOMContentLoaded', e => {
    generateResgistrationId(deviceId);
});

function generateResgistrationId(myDeviceId) {
    registrationId = KeyHelper.generateRegistrationId();
    myIdentifiers['registrationId'] = registrationId;
    myIdentifiers['deviceId'] = myDeviceId;
    store.put('registrationId', registrationId);
    generateIdKey();
}

function generateIdKey() {
    KeyHelper.generateIdentityKeyPair().then(identityKeyPair => {
        idKeyPair = identityKeyPair;
        store.put('identityKey', idKeyPair);
        generatePreKeys()
    });
}

// Generate multiple PreKeys (as per documentation)
function generatePreKeys() {    
    let listOfPreKeysPromise = [];
    for(let i = 0; i < numberOfPreKeys; i++){
        listOfPreKeysPromise.push(KeyHelper.generatePreKey(registrationId + i + 1));
    }
    Promise.all(listOfPreKeysPromise).then(preKeys => {
        preKeys.forEach(preKey => {
            let preKeyObject = {
                keyId: preKey.keyId,
                keyPair: preKey.keyPair
            };
            preKeyObjects.push(preKeyObject);
            store.storePreKey(preKeyObject.keyId, preKeyObject.keyPair);
            let preKeyObjectToSend = {
                id: preKeyObject.keyId,
                key: window.arrBuffToBase64(preKeyObject.keyPair.pubKey)
            };
            preKeyObjectsToSend.push(preKeyObjectToSend); 
        });
        generateSignedPreKey();
    });
}

function generateSignedPreKey() {
    KeyHelper.generateSignedPreKey(idKeyPair, registrationId - 1).then(signedPreKey => {
        signedPreKeyObject = {
            keyId: signedPreKey.keyId,
            keyPair: signedPreKey.keyPair,
            signature: signedPreKey.signature
        }
        store.storeSignedPreKey(signedPreKey.keyId, signedPreKeyObject.keyPair);
        registerWithServer()
    });
}


function registerWithServer() {
    sendKeysToServer();
}

function sendKeysToServer() {
    let url = serverBaseUrl + 'send';
    let requestObject = {
        type: 'init',
        deviceId: deviceId,
        registrationId: registrationId,
        identityKey: window.arrBuffToBase64(idKeyPair.pubKey),
        signedPreKey: {
            id: signedPreKeyObject.keyId,
            key: window.arrBuffToBase64(signedPreKeyObject.keyPair.pubKey),
            signature: window.arrBuffToBase64(signedPreKeyObject.signature)
        },
        preKeys: preKeyObjectsToSend
    }

    window.sendRequest(url, requestObject).then(res => {
        if(res.err) {
            console.error(res. err)
        } else {
            waitForRequestKeys(res)
        }
    });
}

function waitForRequestKeys() {

    let requestObject = {
        registrationId: registrationId,
        deviceId: deviceId
    };
    let url = serverBaseUrl + 'get';
    window.sendRequest(url, requestObject).then(obj => {
        processReceivedKeys(obj);
    })
}


function processReceivedKeys(resJson) {
    if(resJson.err) {
        console.error(res. err)
    } else {
        waitForKeys(resJson)
    }
}

function waitForKeys(resData) {
    
    let processPreKeyObject = {
        registrationId: resData.registrationId,
        identityKey: window.base64ToArrBuff(resData.identityKey),
        signedPreKey: {
            keyId: resData.signedPreKey.id,
            publicKey:  window.base64ToArrBuff(resData.signedPreKey.key),
            signature:  window.base64ToArrBuff(resData.signedPreKey.signature),
        },
        preKey: {
            keyId: resData.preKey.id,
            publicKey:  window.base64ToArrBuff(resData.preKey.key)
        }
    };
    setupSession(processPreKeyObject, resData.deviceId);
}

function setupSession(processPreKeyObject, incomingDeviceIdStr) {
    let recipientAddress = new ls.SignalProtocolAddress(processPreKeyObject.registrationId, incomingDeviceIdStr);
    let sessionBuilder = new ls.SessionBuilder(store, recipientAddress);
    sessionBuilder.processPreKey(processPreKeyObject)
        .then(resp => {
            console.log('Session build!');
            // Store incoming key packet to known contacts
            myContacts[processPreKeyObject.registrationId + incomingDeviceIdStr] = {
                deviceId: parseInt(incomingDeviceIdStr),
                preKeyObject: processPreKeyObject
            };
            // waitForMessageSend();
            const message = new TextEncoder("utf-8").encode(rawMessageStr);
            const myContactIds = Object.keys(myContacts);

            sendMessageToServer(message, myContacts[myContactIds[0]])

        }).catch(err => {
            console.error(err);
        });
}

function waitForMessageSend() {
    let rawMessageStr = "test";
    let message = new TextEncoder("utf-8").encode(rawMessageStr);
    const contactIds = Object.keys(myContacts);
    let messageTo = myContacts[contactIds[0]];
    if(message && messageTo) {
        sendMessageToServer(message, messageTo)
    } else {
        console.error('Invalid To or Message entry. Please check the fields');
    }
}


function sendMessageToServer(message, messageToObject) {
    let url = serverBaseUrl + 'send/message';

    let requestObject = {
        messageTo: {
            registrationId: messageToObject.preKeyObject.registrationId,
            deviceId: messageToObject.deviceId
        },
        messageFrom: {
            registrationId: myIdentifiers.registrationId,
            deviceId: myIdentifiers.deviceId
        },
        ciphertextMessage: 'Invalid ciphertext',
    };
    
    let signalMessageToAddress = new ls.SignalProtocolAddress(requestObject.messageTo.registrationId, 
        requestObject.messageTo.deviceId);
    let sessionCipher = new ls.SessionCipher(store, signalMessageToAddress);

    sessionCipher.encrypt(message).then(ciphertext => {
        requestObject.ciphertextMessage = ciphertext;
        window.sendRequest(url, requestObject).then(res => {
            if(res.err) {
                console.error(res.err);
            } else {
                console.log('Message succesfully sent to server');

                waitForMessageReceive(requestObject.messageFrom)
            }
        });
    }).catch(err => {
        console.error(res.err);
    });
}

function waitForMessageReceive(from) {
    if(from) {
        getMessagesFromServer(from);
    } else {
        getMessagesFromServer();
    }
}

function getMessagesFromServer(messageFrom) {
    let url = serverBaseUrl + 'get/message';
    let messageFromUniqueId = messageFrom.registrationId.toString() + messageFrom.deviceId.toString(); 

    let requestObject = {
        messageTo: myIdentifiers,
        messageFromUniqueId: messageFromUniqueId
    };

    window.sendRequest(url, requestObject).then(res => {
        if(res.err) {
            console.error(res.err);
        } else {
            processIncomingMessage(res);
        }
    })
}

function processIncomingMessage(incomingMessageObj) {
    let signalMessageFromAddress = new ls.SignalProtocolAddress(incomingMessageObj.messageFrom.registrationId, incomingMessageObj.messageFrom.deviceId);
    let sessionCipher = new ls.SessionCipher(store, signalMessageFromAddress); 
    sessionCipher.decryptPreKeyWhisperMessage(incomingMessageObj.ciphertextMessage.body, 'binary').then(plaintext => {
        let decryptedMessage = window.util.toString(plaintext);
        console.log("message received: ", decryptedMessage)
    }).catch(err => {
        console.error(err);
    });
}


function arrBuffToBase64( buffer ) {
	var binary = '';
	var bytes = new Uint8Array( buffer );
	var len = bytes.byteLength;
	for (var i = 0; i < len; i++) {
			binary += String.fromCharCode( bytes[ i ] );
	}
	return window.btoa( binary );
}
function _base64ToArrayBuffer(base64) {
	var binary_string = window.atob(base64);
	var len = binary_string.length;
	var bytes = new Uint8Array(len);
	for (var i = 0; i < len; i++) {
			bytes[i] = binary_string.charCodeAt(i);
	}
	return bytes.buffer;
}