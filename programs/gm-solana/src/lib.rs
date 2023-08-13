use anchor_lang::prelude::*;

declare_id!("7NkK1YTBkNSZBBmppat3btLy5Jy6ELCQnGMii5hkzzmn");

#[program]
pub mod gm_solana {
  use super::*;

  pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
    let base_account = &mut ctx.accounts.base_account;

    base_account.gm_count = 0;

    Ok(())
  }
  
  pub fn say_gm(ctx: Context<SayGm>, message: String) -> Result<()> {
    let base_account = &mut ctx.accounts.base_account;
  
    // Get a copy of input data
    let message = message.clone();
      
    // Get the current solana network time
    let timestamp = Clock::get().unwrap().unix_timestamp;
    
    // Grab the public key of sender,
    let user = *ctx.accounts.user.to_account_info().key;
    
    let gm = GmMessage {
      message, 
      timestamp,
      user, 
    };
    
    base_account.gm_list.push(gm);
    base_account.gm_count += 1;

    Ok(())
  }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
  #[account(init, payer = user, space = 64 + 1024)]
  pub base_account: Account<'info, BaseAccount>,
  
  #[account(mut)]
  pub user: Signer<'info>,
  pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SayGm<'info> {
  #[account(mut)]
  pub base_account: Account<'info, BaseAccount>,
  pub user: Signer<'info>,
}

#[account]
pub struct BaseAccount {
  pub gm_count: u64,
  pub gm_list: Vec<GmMessage>,
}

#[derive(Clone, Debug, AnchorSerialize, AnchorDeserialize)]
pub struct GmMessage {
  pub message: String, 
  pub user: Pubkey, 
  pub timestamp: i64,
}