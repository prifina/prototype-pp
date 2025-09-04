/**
 * Parse streaming response from AI services
 * Handles multiple formats including URL-encoded text= format, SSE, and plain JSON
 */
export function parseStreamingResponse(responseText: string): string {
  let fullText = '';
  
  try {
    // First check if it's URL-encoded format with text= prefixes
    if (responseText.includes('text=')) {
      console.log('Detected text= prefix format, parsing...');
      
      // Split by newlines and process each line
      const lines = responseText.split('\n');
      
      for (const line of lines) {
        if (!line.trim()) continue;
        
        // Handle lines that start with text=
        if (line.startsWith('text=')) {
          const content = line.substring(5); // Remove 'text='
          
          // Skip finish_reason lines
          if (content.includes('finish_reason=')) continue;
          
          try {
            // URL decode the content
            const decoded = decodeURIComponent(content);
            fullText += decoded;
          } catch (e) {
            // If decoding fails, use raw content
            fullText += content;
          }
        }
        // Handle other formats mixed in
        else if (line.startsWith('data: ')) {
          const dataStr = line.substring(6).trim();
          if (dataStr === '[DONE]') break;
          
          try {
            const data = JSON.parse(dataStr);
            if (data.text) fullText += data.text;
          } catch (e) {
            // Ignore invalid JSON
          }
        }
      }
    }
    // Handle SSE format (data: {...})
    else if (responseText.includes('data: ')) {
      console.log('Detected SSE format, parsing...');
      const lines = responseText.split('\n');
      
      for (const line of lines) {
        if (!line.trim() || line.startsWith('event:')) continue;
        
        if (line.startsWith('data: ')) {
          const dataStr = line.substring(6).trim();
          if (dataStr === '[DONE]') break;
          
          try {
            const data = JSON.parse(dataStr);
            
            if (data.choices && Array.isArray(data.choices)) {
              for (const choice of data.choices) {
                if (choice.delta?.content) {
                  fullText += choice.delta.content;
                } else if (choice.text) {
                  fullText += choice.text;
                }
              }
            } else if (data.text) {
              fullText += data.text;
            } else if (data.content) {
              fullText += data.content;
            }
            
            if (data.finish_reason === 'stop') break;
          } catch (e) {
            if (!dataStr.includes('{') && dataStr.length > 0) {
              fullText += dataStr;
            }
          }
        }
      }
    }
    // Handle plain JSON response
    else if (responseText.trim().startsWith('{')) {
      console.log('Detected JSON format, parsing...');
      const data = JSON.parse(responseText);
      
      if (data.answer) fullText = data.answer;
      else if (data.response) fullText = data.response;
      else if (data.text) fullText = data.text;
      else if (data.content) fullText = data.content;
      else if (data.choices?.[0]?.message?.content) fullText = data.choices[0].message.content;
    }
    // Plain text response
    else {
      console.log('Using raw text response');
      fullText = responseText;
    }
  } catch (error) {
    console.error('Error parsing streaming response:', error);
    fullText = responseText;
  }
  
  // Clean up artifacts
  fullText = fullText
    .replace(/;finish_reason=[a-z_]*/gi, '')
    .replace(/\[DONE\]/g, '')
    .replace(/data:\s*/g, '')
    .replace(/^text=/gm, '')
    .trim();
  
  console.log(`Parsed response: ${fullText.length} chars, first 100: "${fullText.substring(0, 100)}"`);
  return fullText;
}

/**
 * Split long messages for WhatsApp (4096 char limit)
 */
export function splitMessageForWhatsApp(message: string, maxLength: number = 4096): string[] {
  if (message.length <= maxLength) {
    return [message];
  }
  
  const messages: string[] = [];
  const paragraphs = message.split('\n\n');
  let currentMessage = '';
  
  for (const paragraph of paragraphs) {
    if (paragraph.length > maxLength - 100) {
      const sentences = paragraph.match(/[^.!?]+[.!?]+/g) || [paragraph];
      
      for (const sentence of sentences) {
        const testMessage = currentMessage 
          ? currentMessage + '\n\n' + sentence 
          : sentence;
        
        if (testMessage.length > maxLength - 50) {
          if (currentMessage) {
            messages.push(currentMessage.trim());
            currentMessage = sentence;
          } else {
            // Split by words if sentence too long
            const words = sentence.split(/\s+/);
            let tempMessage = '';
            
            for (const word of words) {
              const testWord = tempMessage ? tempMessage + ' ' + word : word;
              
              if (testWord.length > maxLength - 50) {
                if (tempMessage) {
                  messages.push(tempMessage.trim());
                }
                tempMessage = word;
              } else {
                tempMessage = testWord;
              }
            }
            currentMessage = tempMessage;
          }
        } else {
          currentMessage = testMessage;
        }
      }
    } else {
      const testMessage = currentMessage 
        ? currentMessage + '\n\n' + paragraph 
        : paragraph;
      
      if (testMessage.length > maxLength - 50) {
        if (currentMessage) {
          messages.push(currentMessage.trim());
        }
        currentMessage = paragraph;
      } else {
        currentMessage = testMessage;
      }
    }
  }
  
  if (currentMessage) {
    messages.push(currentMessage.trim());
  }
  
  // Add part indicators if multiple parts
  if (messages.length > 1) {
    return messages.map((msg, index) => {
      const partInfo = `(${index + 1}/${messages.length})`;
      return index === 0 
        ? msg + '\n\n' + partInfo
        : partInfo + '\n\n' + msg;
    });
  }
  
  return messages;
}

/**
 * Check if disclaimer should be added (once per 24h session)
 */
export async function shouldAddDisclaimer(supabase: any, seatId: string): Promise<boolean> {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const { data: recentMessages } = await supabase
      .from('message_log')
      .select('message_body')
      .eq('seat_id', seatId)
      .eq('direction', 'outbound')
      .eq('message_type', 'chat')
      .gte('created_at', twentyFourHoursAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (!recentMessages || recentMessages.length === 0) {
      return true; // No recent messages, add disclaimer
    }
    
    // Check if any recent message contains disclaimer
    const disclaimerText = "I don't diagnose or prescribe";
    const hasDisclaimer = recentMessages.some(msg => 
      msg.message_body && msg.message_body.includes(disclaimerText)
    );
    
    return !hasDisclaimer;
  } catch (error) {
    console.error('Error checking disclaimer status:', error);
    return false; // Default to not adding if check fails
  }
}