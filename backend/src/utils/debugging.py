def object_to_dict(obj):
    """
    Recursively convert an object to JSON by converting each attribute to JSON.
    """
    # Check if obj is a dictionary
    if isinstance(obj, dict):
        # Recursively convert each value to JSON
        return {key: object_to_dict(value) for key, value in obj.items()}
    # Check if obj is an object (has __dict__ attribute)
    elif hasattr(obj, "__dict__"):
        # Recursively convert each attribute to JSON
        return object_to_dict(obj.__dict__)
    # Check if obj is a list or tuple
    elif isinstance(obj, (list, tuple)):
        # Recursively convert each element to JSON
        return [object_to_dict(item) for item in obj]
    # Base case: return obj (primitive type)
    else:
        return obj
