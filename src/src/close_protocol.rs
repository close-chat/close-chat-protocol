use std::string::String;
use near_bindgen::{near_bindgen, env};
use borsh::{BorshDeserialize, BorshSerialize};
use serde::{Deserialize, Serialize};
use std::collections::{HashMap};

#[near_bindgen]
#[derive(Serialize, Deserialize, BorshDeserialize, BorshSerialize, Debug)]
struct User {
	username: String,
	tg_pub_key: Option<String>,
	signal_pub_key: Option<String>,
	account_owner: String
}

#[derive(Serialize, Deserialize, BorshDeserialize, BorshSerialize, Debug)]
struct CloseProtocol {
	users: HashMap<String, User>
}

#[near_bindgen]
impl CloseProtocol {

	// TODO: Signal_pub_key isn't actually optional but needs to be implemented better on frontend before making it required
	pub fn add_user(&mut self, username: String, tg_pub_key: Option<String>, signal_pub_key: Option<String>) -> bool{
		let user = User { 
			username: username.to_string(), 
			tg_pub_key, 
			signal_pub_key,
			account_owner: env::predecessor_account_id()
		};
		let unique_username = self.users.get(&username).is_none();

		if unique_username {
			self.users.insert(username, user);
			return true;
		} else {
			return false;
		}
	}

	pub fn get_users(&self, username: String) -> &HashMap<String, User> {
		return &self.users;
	}

	pub fn get_user(&self, username: String) -> &User {
		let user = self.users.get(&username).unwrap();
		return user;
	}

	pub fn is_unique_username(&self, username: String) -> bool {
		let unique_username = self.users.get(&username).is_none();
		return unique_username;
	}

	pub fn modify_tg_pub_key(&mut self, username: String, tg_pub_key: String) -> bool{
		let user = self.users.get(&username).unwrap();
		if user.account_owner == env::predecessor_account_id() {
			self.users.entry(username).and_modify(|entry| {
				entry.tg_pub_key = Some(tg_pub_key)
			});
			return true;
		} else {
			return false;
		}
	}

	pub fn modify_sg_pub_key(&mut self, username: String, signal_pub_key: String) -> bool{
		let user = self.users.get(&username).unwrap();
		if user.account_owner == env::predecessor_account_id() {
			self.users.entry(username).and_modify(|entry| {
				entry.signal_pub_key = Some(signal_pub_key)
			});
			return true;
		} else {
			return false;
		}
	}
}

impl Default for CloseProtocol {
	fn default() -> Self {
		Self {
			users: HashMap::new()
		}
	}
}

#[cfg(not(target_arch = "wasm32"))]
#[cfg(test)]
mod tests {
    use super::*;
    use near_bindgen::MockedBlockchain;
    use near_bindgen::{VMContext, Config, testing_env};

	fn get_context(predecessor_account_id: String) -> VMContext {
		VMContext {
			current_account_id: "alice.near".to_string(),
            signer_account_id: "bob.near".to_string(),
            signer_account_pk: vec![0, 1, 2],
            predecessor_account_id,
            input: vec![],
            block_index: 0,
            account_balance: 0,
			is_view: false,
            storage_usage: 0,
			block_timestamp: 123789,
            attached_deposit: 500000000,
            prepaid_gas: 10u64.pow(9),
            random_seed: vec![0, 1, 2],
            output_data_receivers: vec![],
		}
	}

    #[test]
	fn test_contract_creation() {
		let username = "carol.near";
		testing_env!(get_context(username.to_string()), Config::default());
		let mut contract = CloseProtocol::default();
		
		
		let success = contract.add_user(username.to_string(), None, None);
		assert_eq!(success, true);

		let users = contract.get_users(username.to_string());
		let user = contract.get_user(username.to_string());

		println!("user_list: {:?}", users);
		println!("user: {:?}", user);

		

	}
}
