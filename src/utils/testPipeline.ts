import { supabase } from '@/integrations/supabase/client';

export const testWhatsAppPipeline = async () => {
  console.log('Testing WhatsApp pipeline...');
  
  try {
    // Test 1: Simple function test
    console.log('1. Testing simple function...');
    const { data: simpleTest, error: simpleError } = await supabase.functions.invoke('simple-test', {
      body: {}
    });
    console.log('Simple test result:', { data: simpleTest, error: simpleError });
    
    // Test 2: Test webhook directly
    console.log('2. Testing webhook direct...');
    const { data: webhookTest, error: webhookError } = await supabase.functions.invoke('test-webhook-direct', {
      body: {}
    });
    console.log('Webhook test result:', { data: webhookTest, error: webhookError });
    
    // Test 3: Test AI twin chat
    console.log('3. Testing AI twin chat...');
    const { data: aiTest, error: aiError } = await supabase.functions.invoke('ai-twin-chat', {
      body: {
        seat_id: 'd6b53a9e-b4f9-46de-b0c3-663aa083f228',
        message: 'Hello, I need help with stretching exercises',
        channel: 'whatsapp',
        user_context: {
          name: 'Markus August 4',
          role: 'resident',
          show_name: 'Wicked',
          tour_or_resident: 'resident',
          goals: { goals: 'Better energy levels' },
          sleep_env: { environment: 'home', noise_level: 'quiet' },
          food_constraints: { allergies: ['Dairy'], dietary_preferences: ['Vegetarian'] },
          injuries_notes: 'Currently training for a marathon',
          phone_e164: '+16468014054'
        }
      }
    });
    console.log('AI twin test result:', { data: aiTest, error: aiError });
    
    // Test 4: Test WhatsApp send
    console.log('4. Testing WhatsApp send...');
    const { data: whatsappTest, error: whatsappSendError } = await supabase.functions.invoke('whatsapp-send', {
      body: {
        to: 'whatsapp:+16468014054',
        text: {
          body: 'Test message from pipeline diagnostic - if you receive this, WhatsApp sending works!'
        }
      }
    });
    console.log('WhatsApp send test result:', { data: whatsappTest, error: whatsappSendError });
    
    return {
      simpleTest: { data: simpleTest, error: simpleError },
      webhookTest: { data: webhookTest, error: webhookError },
      aiTest: { data: aiTest, error: aiError },
      whatsappTest: { data: whatsappTest, error: whatsappSendError }
    };
    
  } catch (error) {
    console.error('Pipeline test failed:', error);
    throw error;
  }
};