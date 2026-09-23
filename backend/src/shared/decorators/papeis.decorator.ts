import { SetMetadata } from '@nestjs/common'
import type { PapelUsuario } from '../../modules/usuarios/domain/usuario.entity.js'

export const CHAVE_PAPEIS = 'papeis'

export const Papeis = (...papeis: PapelUsuario[]) => SetMetadata(CHAVE_PAPEIS, papeis)
