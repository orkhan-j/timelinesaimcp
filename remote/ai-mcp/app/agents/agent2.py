"""
Agent 2 - Data Analysis Agent
Handles various data analysis tasks
"""
from typing import Dict, Any, List, Union
import logging
import random
from datetime import datetime

logger = logging.getLogger(__name__)

async def handle_agent2_request(
    prompt: str, 
    context: Dict[str, Any] = None, 
    parameters: Dict[str, Any] = None
) -> Dict[str, Any]:
    """
    Perform data analysis based on the input prompt and parameters.
    
    Args:
        prompt: The input text or data to analyze
        context: Additional context for analysis
        parameters: Analysis parameters including 'analysis_type'
        
    Returns:
        Dict containing analysis results and metadata
    """
    context = context or {}
    parameters = parameters or {}
    analysis_type = parameters.get('analysis_type', 'basic')
    
    logger.info(f"Performing {analysis_type} analysis on input")
    
    # Generate mock analysis based on analysis_type
    if analysis_type == 'sentiment':
        # Simple sentiment analysis mock
        sentiment_score = random.uniform(-1, 1)
        if sentiment_score > 0.3:
            sentiment = 'positive'
        elif sentiment_score < -0.3:
            sentiment = 'negative'
        else:
            sentiment = 'neutral'
            
        result = {
            'sentiment': sentiment,
            'score': round(sentiment_score, 2),
            'confidence': round(random.uniform(0.7, 0.99), 2)
        }
        
    elif analysis_type == 'stats':
        # Basic text statistics
        words = prompt.split()
        chars = len(prompt)
        sentences = len([c for c in prompt if c in '.!?'])
        
        result = {
            'word_count': len(words),
            'character_count': chars,
            'sentence_count': sentences,
            'avg_word_length': sum(len(word) for word in words) / len(words) if words else 0,
            'avg_sentence_length': len(words) / sentences if sentences > 0 else 0
        }
        
    elif analysis_type == 'keywords':
        # Mock keyword extraction (simple version)
        words = [w.lower() for w in prompt.split() if w.isalpha()]
        word_freq = {}
        for word in words:
            if len(word) > 3:  # Only consider words longer than 3 characters
                word_freq[word] = word_freq.get(word, 0) + 1
                
        # Get top 5 most common words
        keywords = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)[:5]
        
        result = {
            'top_keywords': [{'word': k, 'frequency': v} for k, v in keywords],
            'unique_words': len(word_freq)
        }
        
    else:  # basic analysis
        words = prompt.split()
        result = {
            'analysis_type': 'basic',
            'word_count': len(words),
            'character_count': len(prompt),
            'analysis_timestamp': datetime.utcnow().isoformat()
        }
    
    # Add request metadata
    result.update({
        'analysis_type': analysis_type,
        'parameters': parameters,
        'context_keys': list(context.keys()),
        'request_timestamp': datetime.utcnow().isoformat()
    })
    
    return result
