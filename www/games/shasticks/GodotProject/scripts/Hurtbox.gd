extends Area2D
class_name Hurtbox

@onready var owner_fighter: Fighter = get_parent()

func receive_hit(damage: int, knockback: float):
	owner_fighter.take_damage(damage, knockback)
