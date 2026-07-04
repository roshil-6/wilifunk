extends Area2D
class_name Hitbox

@export var damage: int = 10
@export var knockback_force: float = 300.0

@onready var owner_fighter: Fighter = get_parent()

func _ready():
	# Connect the area_entered signal
	area_entered.connect(_on_area_entered)
	
	# Usually, a hitbox should only be active during specific animation frames.
	# Make sure the CollisionShape2D child of this node has its 'Disabled' property
	# toggled ON and OFF via the AnimationPlayer!

func _on_area_entered(area: Area2D):
	# Check if what we hit is a Hurtbox, and not our own
	if area is Hurtbox and area.owner_fighter != owner_fighter:
		var dir = 1 if owner_fighter.is_facing_right else -1
		area.receive_hit(damage, knockback_force * dir)
		
		# Optional: Play hit sound or spawn hit particles here!
