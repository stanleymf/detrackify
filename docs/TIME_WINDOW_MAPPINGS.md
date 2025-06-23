# Time Window Mappings

This document outlines all the time window mappings currently implemented in the Detrackify order processing system.

## Overview

The system uses range-based logic to convert time windows from Shopify order tags into specific job release times and delivery completion time windows for Detrack. Time windows are matched based on their start time falling within defined ranges.

## Job Release Time Mappings

| Time Window Range | Start Time (HH:MM) | End Time (HH:MM) | Converted To | Minutes Range |
|-------------------|-------------------|------------------|--------------|---------------|
| Morning | 10:00 | 14:00 | 08:45 | 600-840 |
| Afternoon | 14:00 | 18:00 | 13:45 | 840-1080 |
| Evening | 18:00 | 22:00 | 17:15 | 1080-1320 |

### Logic
- Any time window that starts between 10:00-14:00 gets converted to "08:45"
- Any time window that starts between 14:00-18:00 gets converted to "13:45"
- Any time window that starts between 18:00-22:00 gets converted to "17:15"

## Delivery Completion Time Window Mappings

| Time Window Range | Start Time (HH:MM) | End Time (HH:MM) | Converted To | Minutes Range |
|-------------------|-------------------|------------------|--------------|---------------|
| Morning | 10:00 | 14:00 | Morning | 600-840 |
| Afternoon | 14:00 | 18:00 | Afternoon | 840-1080 |
| Evening | 18:00 | 22:00 | Night | 1080-1320 |

### Logic
- Any time window that starts between 10:00-14:00 gets converted to "Morning"
- Any time window that starts between 14:00-18:00 gets converted to "Afternoon"
- Any time window that starts between 18:00-22:00 gets converted to "Night"

## Implementation Details

### Range Matching
The system converts time windows to minutes for easier comparison:
- 10:00 = 600 minutes
- 14:00 = 840 minutes
- 18:00 = 1080 minutes
- 22:00 = 1320 minutes

### Input Format
Time windows are expected in the format: `HH:MM-HH:MM`
Examples:
- `10:00-14:00`
- `14:00-18:00`
- `18:00-22:00`
- `11:00-15:00` (would match 10:00-14:00 range)

### Fallback Behavior
If a time window doesn't match any of the defined ranges, the system returns the original time window unchanged.

## Examples

### Job Release Time Examples
- `10:00-14:00` → `08:45`
- `11:00-15:00` → `08:45` (starts within 10:00-14:00 range)
- `14:00-18:00` → `13:45`
- `15:00-19:00` → `13:45` (starts within 14:00-18:00 range)
- `18:00-22:00` → `17:15`
- `19:00-23:00` → `17:15` (starts within 18:00-22:00 range)

### Delivery Completion Time Window Examples
- `10:00-14:00` → `Morning`
- `11:00-15:00` → `Morning` (starts within 10:00-14:00 range)
- `14:00-18:00` → `Afternoon`
- `15:00-19:00` → `Afternoon` (starts within 14:00-18:00 range)
- `18:00-22:00` → `Night`
- `19:00-23:00` → `Night` (starts within 18:00-22:00 range)

## Code Location

The time window conversion logic is implemented in:
- `src/lib/orderProcessor.ts`
- Functions: `convertTimeWindowToJobReleaseTime()` and `convertTimeWindowToDeliveryTimeWindow()`

## Future Enhancements

Additional time window ranges can be easily added by:
1. Adding new range conditions in the conversion functions
2. Updating this documentation
3. Testing with sample orders to verify the mappings work correctly 