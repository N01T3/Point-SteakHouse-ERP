import { IsEmail, IsEnum, IsString, MinLength } from 'class-validator'
import { PapelUsuario } from '../domain/usuario.entity.js'

export class RegistrarUsuarioDto {
  @IsString()
  @MinLength(1)
  nome!: string

  @IsEmail()
  email!: string

  @IsString()
  @MinLength(8)
  senha!: string

  @IsEnum(PapelUsuario)
  papel!: PapelUsuario
}
