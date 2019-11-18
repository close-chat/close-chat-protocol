# Clos3: An unstopable messaging protocol
Peer-to-peer encrypted chat protocol, build on NEAR.

## description
The end goal of Clos3 is to allow end-users to be able to send eachother peer-to-peer encrypted messages that only the recipient and the sender are able to read. By storing all of the encrypted messages on the NEAR blockchain we create completely censorship resistant "unstopable" peer-to-peer communication platform.


### Phase 0: Pseudonomynous message-channels
The goal here is to proof the out the usecase of on-chain chatting and creating an app around this, users will be able to create a new `messaging channel` between themselfs and a selected recipient. 

Interfaces: 

```
// channel.rs

use std::string::String;
use near_bindgen::{near_bindgen, env};
use borsh::{BorshDeserialize, BorshSerialize};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[near_bindgen]
#[derive(Serialize, Deserialize, BorshDeserialize, BorshSerialize, Debug)]
struct Message {
	sender: String,
	message: String,
	date_time: u64,
}

#[near_bindgen]
#[derive(Default, Serialize, Deserialize, BorshDeserialize, BorshSerialize, Debug)]
struct Channel {
	messages: Vec<Message>,
	creator: String, 
	recipient: String
}

#[near_bindgen] 
impl Channel {
	// Initializer
	pub fn new(creator: String, recipient: String) -> Self {
		Self {
			messages: vec![],
			creator,
			recipient
		}
	}

	// Stores new message
	pub fn new_message(&mut self, sender: String, message: String) {}

	// Retrieves all messages
	pub fn get_messages(& self) -> Vec<Messages>  {}
}

```

```
// close_protocol.rs

use std::string::String;
use near_bindgen::{near_bindgen, env};
use borsh::{BorshDeserialize, BorshSerialize};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

mod channel;
type Channel = channel::Channel;
type Message = channel::Message;

#[near_bindgen]
#[derive(Serialize, Deserialize, BorshDeserialize, BorshSerialize, Debug)]
struct CloseProtocol {
	active_channels: HashMap<u64, Channel>,
}

#[near_bindgen]
impl CloseProtocol {
	// Takes in the account name of the person this channel should be created with
	// It creates a new messaging_channel between predesessor_id and the recipient
	// Returns channel id
	pub fn new_channel(&mut self, recipient: String) -> u64 {}

	// Send message to a specific channel
	// Can only work if sender is either recipient or creator of the Channel
	pub fn send_message_to_channel(&mut self, channel_id: u64, message: String) {}

	// Returns all messages that have been send to specific channel
	// Can only work if sender is either recipient or creator of the Channel
	pub fn get_messages_from_channel(&self, channel_id: u64) -> Vec<Message> {}
}


impl Default for Markets {
	fn default() -> Self {
		Self {
			active_channels: HashMap::new(),
		}
	}
}
```

Pros:
  * All messages stored on-chain
  * Completely unstoppable
  * App operator has minimal power
  * Could chat without the need of operators

Cons: 	
  * All messages and recipients could be tracked through block-explorer
  * Only pseudonymous

### Phase 1: Double encrypted messaging
Pros:
  * All messages are encrypted when send stored on chain, so the messages are private
  * Unstoppable in the sense that the storage and addition of encrypted messages is unstoppable

Cons: 	
  * Puts a lòt of power in app developers hands
  * Need to give each user some sort of private key so that they are able to decrypt their messages even if app (opperator) gets shut down
  * App developers can still be easily shut down, build in backdoors


### Phase 2: Completely unstopable messaging protocol
  * **Option 1**: Host the messaging app on IPFS & open-source it, this way users are ensured that their app doesn't have a backdoor
  * **Option 2**: Reseach a way to do decryption trustlessly on-chain, where only channel participants are able to decrypt and retrieve messages they send to eachother. 