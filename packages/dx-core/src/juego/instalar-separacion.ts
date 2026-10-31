// Separación mínima respecto del último pedido del juego (café o reclutas).
//
// Es MENOS que el cooldown compartido de diez, y este pedido tampoco lo consume.
// Es la única excepción y tiene motivo: con diez, cualquier oferta de instalar
// en el tramo 1-10 tapaba la de reclutar, que sale justo en la 10 —o sea que
// reclutar se caía de la derivada 10 (19% de la cohorte) a la 30 (6%)—.
//
// La excepción se sostiene porque instalar es lo único que el juego ofrece que
// NO le pide nada a la persona: ni plata, ni mandarle un mensaje a nadie, ni una
// cuenta, ni un dato. Es una comodidad, se sale con un toque, y es el
// prerrequisito de los recordatorios. Si alguna vez esta diapo pasa a pedir
// algo, tiene que entrar al cooldown compartido como las otras dos.
export const INSTALAR_SEPARACION = 4
