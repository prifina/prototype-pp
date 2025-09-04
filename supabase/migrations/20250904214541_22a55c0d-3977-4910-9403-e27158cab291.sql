-- Clean up duplicate pending seat for phone +16468014054
-- Keep only the active seat SC-MEVUU3PP-XC3O and remove the pending duplicate SC-MF5ORSXZ-YBKA
DELETE FROM seats 
WHERE phone_number = '+16468014054' 
  AND status = 'pending' 
  AND seat_code = 'SC-MF5ORSXZ-YBKA';