# Twitter AI Illust Scanner

It chrome extension can scanning if the user tweeting the illustration is using AI

イラストがAI絵師によって作成されたかどうかを独自の基準で勝手に判定するChrome拡張機能

![Warn AI illustrator who](https://github.com/user-attachments/assets/a8fec8c7-0a2c-4a30-aeb6-4d1bd7d78b1b)

## Judgment Criteria

If the score exceeds 50 points, it is determined to be AI and the results are cached locally for 7 days.

### Explanation of Each Rule

1. **isIncludeWordAboutAIinProfile**
   - **Rule**: Checks whether the profile includes a word related to AI.
   - **Condition**: `=` (checks for equality, i.e., whether the condition is true)
   - **Threshold**: `true`
   - **Score**: 60 points (If the profile includes a word related to AI, 60 points are awarded.)

2. **isIncludeWordAboutHumaninProfile**
   - **Rule**: Checks whether the profile includes a word related to humans.
   - **Condition**: `=` (checks for equality, i.e., whether the condition is true)
   - **Threshold**: `true`
   - **Score**: -60 points (If the profile includes a word related to humans, 60 points are subtracted.)

3. **intervalAvg**
   - **Rule**: Average interval between tweets posted.
   - **Conditions and Scores**:
     - `=` null → 0 points (If the average value is not present)
     - `<` 1 → 50 points (If the average value is less than 1)
     - `<` 0.5 → 20 points (If the average value is less than 0.5)

4. **imgProportion**
   - **Rule**: Determines the score based on the proportion of an media tweets.
   - **Conditions and Scores**:
     - `>` 0.95 → 40 points (If the image proportion is greater than 95%)
     - `>` 0.9 → 20 points (If the image proportion is greater than 90%)
     - `>` 0.7 → 10 points (If the image proportion is greater than 70%)
     - `>` 0.5 → 5 points (If the image proportion is greater than 50%)

5. **isIncludeWordAboutAI**
   - **Rule**: Checks whether a specific word related to AI is included in each tweets.
   - **Condition**: `=` (checks for equality)
   - **Threshold**: `true`
   - **Score**: 70 points (If the specific word related to AI is included, 70 points are awarded.)
