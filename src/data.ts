import bannersStatic from './../static/data/banners.json'
import charas from './../static/data/characters.json'
import weaps from './../static/data/weapons.json'

export enum Stars {
  FIVE_STAR = 5,
  FOUR_STAR = 4,
  THREE_STAR = 3,
}

export type Rarity = 'FIVE_STAR' | 'FOUR_STAR' | 'THREE_STAR'

export const characterVision = ['anemo', 'cryo', 'hydro', 'pyro', 'electro', 'geo']

export const weaponType = ['sword', 'claymore', 'bow', 'catalyst', 'polearm']

export interface Character {
  /** Character / weapon name */
  name: string
  /** Typo name, for compatibility with the https://github.com/AguzzTN54/Genshin-Impact-Wish-Simulator repo */
  typoName?: string
  /** Character vision / weapon type */
  type: string
  /** Character / weapon rarity */
  rarity: Rarity
  /** Is limited */
  limited: boolean
  /** Character image offset */
  offset: {
    top: number
    left: number
  }
}

export type Weapon = Omit<Character, 'offset'>

export interface CharacterBanner {
  /** Patch number */
  patch: number
  /** Banner name */
  name: string
  /** Typo name, for compatibility with the https://github.com/AguzzTN54/Genshin-Impact-Wish-Simulator repo */
  typoName?: string
  /** Banner type */
  type: 'character' | 'weapon'
  /** Is standard */
  standard: boolean
  /** Featured character */
  character: string
  /** Rate up character / weapon */
  rateup: string[]
}

export type WeaponBanner = Omit<CharacterBanner, 'character'> & {
  /** Featured weapon */
  featured: string[]
}

export type Banner = CharacterBanner | WeaponBanner

export let characters: Map<string, Character>
export let weapons: Map<string, Weapon>
export let banners: Map<string, Banner>

/** Standard only characters */
export const standardOnlyCharacters = ['amber', 'kaeya', 'lisa']

/** Cache data into memory */
export function cache() {
  characters = new Map([...(charas.map((char) => [char.name, char]) as [string, Character][])])
  weapons = new Map([...(weaps.map((weap) => [weap.name, weap]) as [string, Weapon][])])
  banners = new Map([
    ...(bannersStatic.map((banner) => [banner.name, banner]) as [string, Banner][]),
  ])
}
