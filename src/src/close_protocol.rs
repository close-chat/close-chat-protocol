use std::string::String;
use near_bindgen::{near_bindgen, env};
use borsh::{BorshDeserialize, BorshSerialize};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[near_bindgen]
#[derive(Serialize, Deserialize, BorshDeserialize, BorshSerialize, Debug)]
struct User {
	username: String,
	tg_pub_key: String,
	signal_pub_key: String
}

#[near_bindgen]
#[derive(Serialize, Deserialize, BorshDeserialize, BorshSerialize, Debug)]
struct CloseProtocol {
	users: HashMap<String, User>
}

#[near_bindgen]
impl CloseProtocol {

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
}
