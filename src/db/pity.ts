import mongoose from 'mongoose'

export interface Pity extends mongoose.Document {
  /** Pity id (discord user id and banner type) */
  pityId: string
  /** Current five star total pulls */
  FIVE_STAR: number
  /** Current four star pity */
  FOUR_STAR: number
  /** Wished weapon */
  WISHED_WEAPON?: string
}

const pitySchema = new mongoose.Schema<Pity>({
  pityId: {
    type: String,
    required: true,
  },
  FIVE_STAR: {
    type: Number,
    required: true,
  },
  FOUR_STAR: {
    type: Number,
    required: true,
  },
  WISHED_WEAPON: String,
})

const pity = mongoose.model<Pity>('pity', pitySchema)

export default pity
