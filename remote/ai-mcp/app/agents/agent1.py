"""
Agent 1 - Text Processing Agent
Handles various text processing tasks
"""
from typing import Dict, Any
import logging

logger = logging.getLogger(__name__)

async def handle_agent1_request(prompt: str, context: Dict[str, Any] = None, parameters: Dict[str, Any] = None) -> Dict[str, Any]:
    """
    Process text using various processing modes.
    
    Args:
        prompt: The input text to process
        context: Additional context for processing
        parameters: Additional parameters including 'mode' for processing type
        
    Returns:
        Dict containing processed text and metadata
    """
    context = context or {}
    parameters = parameters or {}
    
    mode = parameters.get('mode', 'echo')
    
    logger.info(f"Processing text with mode: {mode}")
    
    # Simple processing based on mode
    if mode == 'uppercase':
        processed = prompt.upper()
    elif mode == 'lowercase':
        processed = prompt.lower()
    elif mode == 'length':
        processed = len(prompt)
    elif mode == 'words':
        processed = len(prompt.split())
    elif mode == 'reverse':
        processed = prompt[::-1]
    elif mode == 'analysis':
        words = prompt.split()
        processed = {
            'word_count': len(words),
            'char_count': len(prompt),
            'unique_words': len(set(words)),
            'avg_word_length': sum(len(word) for word in words) / len(words) if words else 0
        }
    else:  # echo mode
        processed = prompt
    
    return {
        'processed_text': processed,
        'mode': mode,
        'original_length': len(prompt),
        'context_keys': list(context.keys()),
        'parameters': parameters
    }
