use anchor_lang::prelude::*;

declare_id!("7NkK1YTBkNSZBBmppat3btLy5Jy6ELCQnGMii5hkzzmn");

#[program]
pub mod gm_solana {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
