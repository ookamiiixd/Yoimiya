<div align="center">
  <img src="./static/images/etc/yoimiya.jpg" width="200">
</div>

# Yoimiya

Simple Genshin Impact wish simulator discord bot. This bot is useful to test out your luck before doing the actual gacha (don't blame me if your results sucks anyway) or ~~because you simply zero on primos~~ just to have some fun.

This project is inspired from [Genshin-Impact-Wish-Simulator](https://github.com/AguzzTN54/Genshin-Impact-Wish-Simulator) and uses assets from there. It's a cool project too, you may want to check it out.

## Invite Yoimiya

You can invite Yoimiya to your server [here](https://discord.com/api/oauth2/authorize?client_id=990659611885453322&permissions=68608&scope=bot).

## Updates

All Yoimiya's related updates will be posted on Telegram channel. Get notified [here](https://t.me/yoimiya_updates).

## Rates

This rates is opinionated since we don't really know Genshin's rates works internally.

Soft pity counter started at **75th** pull for standard and character banner and **65th** for weapon banner. Hard pity is triggered at **90th** pull for standard and character banner and **80th** for weapon banner

- **3 Stars**.
  Rates is `94.3%` for standard and character banner and `93.3%` for weapon banner. Will be set as `0%` once hard pity is reached. This will be substracted once soft pity counter is started, by `n` pulls after soft pity start \* `6.2125` (standard and character banner) or `6.20625` (weapon banner) until it reach hard pity.

Table example for standard and character banner:

<table>
  <tr>
    <td>
      <strong>Pulls</strong>
    </td>
    <td>1</td>
    <td>...</td>
    <td>75</td>
    <td>76</td>
    <td>...</td>
    <td>90</td>
  </tr>
  <tr>
    <td>
      <strong>Rates</strong>
    </td>
    <td>94.3%</td>
    <td>...</td>
    <td>88.0875%</td>
    <td>81.875%</td>
    <td>...</td>
    <td>0%</td>
  </tr>
</table>

- **4 Stars**.
  Rates is `5.1%` for standard and character banner and `6%` for weapon banner. Guaranteed on every 10th pull. Will be set as `0%` once hard pity is reached.
- **5 Stars**
  Rates is `0.6%` for standard and character banner and `0.7%` for weapon banner. Will be set as `100%` once hard pity is reached. This will be added once soft pity counter is started, by `n` pulls after soft pity start \* `6.2125` (standard and character banner) or `6.20625` (weapon banner) until it reach hard pity - 1.

Table example for standard and character banner:

<table>
  <tr>
    <td>
      <strong>Pulls</strong>
    </td>
    <td>1</td>
    <td>...</td>
    <td>75</td>
    <td>76</td>
    <td>...</td>
    <td>90</td>
  </tr>
  <tr>
    <td>
      <strong>Rates</strong>
    </td>
    <td>0.6%</td>
    <td>...</td>
    <td>6.8125%</td>
    <td>13.025%</td>
    <td>...</td>
    <td>100%</td>
  </tr>
</table>

## Limitations

- The gacha results appearance doesn't really looks like the real one.
- Images may looks blurry.
- Images doesn't properly scaled. This mean that you may see some image is smaller than another and vice versa.
- Currently the **Fate Point System** is applied to all weapon banners including those from pre 2.0 patch.
- **There's no Beginner Banner** and won't be added.

If you have any suggestion for those limitations, let me know by opening an issue.

## Requirements

- NodeJS `v16.x.x` or higher.
- MongoDB `v4.x` or higher.

## Installation

1. Download or clone this repo.
1. Install the dependencies (Yarn recommended).

## Setup

Before you can use the bot, you have to setup things first like downloads and generate the images. It's done this way to keep the repo size small. Note: **You have to download and generate the images in sequentially order**.

1. **Downloading images**.
   Execute `yarn download` to download the images.
2. **Generating images**.
   Execute `yarn generate` to process downloaded images and generate the edited one.
3. **Setup `env` file**.
   First copy `.env.example` into `.env`. Then replace `BOT_TOKEN` with your Discord bot token and replace `DATABASE_URL` with your database connection url.

## Running the bot

When developing, you may want to use the `yarn dev` command since this command will watch changes and restart the bot automatically.

When starting on production, you can use the `yarn start` command. Note that you have to build the bot using the `yarn build` command first.

## Notice

This project is not affiliated with Hoyoverse, all data used for this project belongs to Hoyoverse.
