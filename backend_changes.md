# Backend Changes Needed

## 1. Update get_all_outfits() in outfits.py

Add `is_daily_outfit` flag to the response:

```python
@outfits_bp.route('/', methods=['GET'])
def get_all_outfits():
    # ... existing code ...
    
    outfits_data = []
    for outfit in pagination.items:
        # Check if this outfit is linked to any daily outfit
        is_daily_outfit = db.session.query(
            db.exists().where(DailyOutfit.outfit_id == outfit.id)
        ).scalar()
        
        # Get the outfit's composite image as the thumbnail
        composite_image_url = get_outfit_image_url(outfit)

        # Get outfit tags
        from app.utils.tag_helpers import get_tag_names_for_item, TARGET_OUTFIT
        outfit_tags = get_tag_names_for_item(outfit.id, TARGET_OUTFIT)

        outfits_data.append({
            "id": str(outfit.id),
            "created_at": outfit.created_at.isoformat(),
            "generated_by": outfit.generated_by,
            "is_daily_outfit": is_daily_outfit,  # NEW FIELD
            "composite_image_url": composite_image_url,
            "title": outfit.title,
            "item_count": len(outfit.outfit_items),
            "tags": outfit_tags
        })
    # ... rest of function
```

## 2. Update get_outfit() in outfits.py

```python
@outfits_bp.route('/<uuid:outfit_id>', methods=['GET'])
def get_outfit(outfit_id):
    # ... existing code ...
    
    # Check if this outfit is linked to any daily outfit
    is_daily_outfit = db.session.query(
        db.exists().where(DailyOutfit.outfit_id == outfit.id)
    ).scalar()

    return jsonify({
        "id": str(outfit.id),
        "notes": outfit.explanation,
        "created_at": outfit.created_at.isoformat(),
        "generated_by": outfit.generated_by,
        "is_daily_outfit": is_daily_outfit,  # NEW FIELD
        "context": outfit.context,
        "wardrobe_items": outfit_items_data,
        "worn_outfits": worn_outfits_data,
        "title": outfit.title,
        "composite_image_url": composite_image_url,
        "tags": outfit_tags
    }), 200
```

## 3. Add copy endpoint for daily outfits

```python
@outfits_bp.route('/<uuid:outfit_id>/copy', methods=['POST'])
def copy_outfit(outfit_id):
    firebase_user = verify_firebase_token()
    if not firebase_user:
        return jsonify({"error": "Unauthorized"}), 401
    
    user = User.query.filter_by(firebase_uid=firebase_user['uid']).first()
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    # Get original outfit
    original_outfit = Outfit.query.get(outfit_id)
    if not original_outfit or original_outfit.user_id != user.id:
        return jsonify({"error": "Outfit not found or not owned by user"}), 404
    
    # Create new outfit copy
    new_outfit = Outfit(
        id=uuid.uuid4(),
        generated_by='manual',  # Always manual for copies
        context={},  # Clear context for manual outfit
        explanation=original_outfit.explanation,
        title=f"{original_outfit.title} (Copy)",
        user_id=user.id,
        created_at=datetime.utcnow()
    )
    db.session.add(new_outfit)
    db.session.flush()

    # Copy outfit items
    for outfit_item in original_outfit.outfit_items:
        new_outfit_item = OutfitItem(
            id=uuid.uuid4(),
            outfit_id=new_outfit.id,
            wardrobe_item_id=outfit_item.wardrobe_item_id
        )
        db.session.add(new_outfit_item)
    
    # Copy tags
    from app.utils.tag_helpers import get_tag_names_for_item, assign_tags_to_item, TARGET_OUTFIT
    original_tags = get_tag_names_for_item(original_outfit.id, TARGET_OUTFIT)
    if original_tags:
        assign_tags_to_item(new_outfit.id, TARGET_OUTFIT, original_tags)
    
    db.session.commit()

    # Generate composite image for the copy
    image_key = generate_and_upload_outfit_image(new_outfit)
    image_url = get_outfit_image_url(new_outfit) if image_key else None

    return jsonify({
        "message": "Outfit copied successfully",
        "outfit": {
            "id": str(new_outfit.id),
            "title": new_outfit.title,
            "composite_image_url": image_url
        }
    }), 201
```

## 4. Update edit_outfit() to change generated_by to manual

```python
@outfits_bp.route('/<uuid:outfit_id>', methods=['PUT'])
def edit_outfit(outfit_id):
    # ... existing auth code ...
    
    # Check if this is a daily outfit (shouldn't be editable)
    is_daily_outfit = db.session.query(
        db.exists().where(DailyOutfit.outfit_id == outfit.id)
    ).scalar()
    
    if is_daily_outfit:
        return jsonify({"error": "Daily outfits cannot be edited directly. Please copy the outfit first."}), 400
    
    data = request.get_json()
    title = data.get('title')  # NEW FIELD
    notes = data.get('notes')
    wardrobe_item_ids = data.get('wardrobe_item_ids')
    updated = False
    
    # If outfit was AI-generated and is being edited, change to manual
    if outfit.generated_by == 'chatgpt':
        outfit.generated_by = 'manual'
        outfit.context = {}  # Clear AI context
        updated = True
    
    if title is not None:
        outfit.title = title
        updated = True
    
    if notes is not None:
        outfit.explanation = notes
        updated = True
    
    # ... rest of existing wardrobe_item_ids logic ...
    
    if updated:
        db.session.commit()
    
    return jsonify({'message': 'Outfit updated successfully'}), 200
```

## 5. Add import for DailyOutfit

At the top of outfits.py, add:
```python
from app.models.daily_outfit import DailyOutfit
```