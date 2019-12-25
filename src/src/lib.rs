#[cfg(feature = "wee_alloc")]

#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[macro_use]
mod close_protocol;
