# Set card game solver (setcgs)
A computer vision web application that solves the card game [Set](https://en.wikipedia.org/wiki/Set_(card_game)). The sets are identified from an uploaded image. 

## Usage
1. Go to https://charleskolozsvary.github.io/setcgs
2. Upload an image (with cards from Set).
   - For best results, ensure the photo is well-lit, the background is relatively uniform, and there is minimal glare. But these conditions are forunately not *too* strict---image quality is generally more important, but any modern phone camera provides plenty of resolution.[^1]
3. Click "Identify sets", wait 15 seconds or so, then view the labelled cards and sets!
   - If the cards were labelled correctly and no sets are highlighted, there were none.
  
## Demo Screencast
<a href="https://www.youtube.com/watch?v=xK-QXZqr05M">
  <img width="444" height="316" alt="A phone screencast of using the setcgs web app" src="https://github.com/user-attachments/assets/552b06c4-45a7-45f3-b0a8-d544e777c8c9" />
</a>

## Walked through example[^2]
Here's an image with some sets:

<img src='examples/example.jpg' width='800'>

### Identifying features
Every card in *Set* has four features, each of which have three varieties. 

| color   |  shape     | number | filling |
| ------- | ---------- | ------ | ------- |
| purple  |  squiggle  |   1    |  empty   | 
| red     |   rhombus  |   2    |  dashed  | 
| green   |   oval     |   3    |  full    |

The card features as identified by the program are pictured below. Each feature is abbreviated by its first or first two letters ('P' is for 'purple', 'OV' is for 'oval', 'E' is for empty, and so on). You can check for yourself that they are correct.

<img src='https://github.com/user-attachments/assets/1feebc33-d118-48cb-a4f9-630eba8bb7cf' width='800'>

### Sets
There end up being 5 sets among those cards. Here they are highlighted (as outputted by the program):

<img src='https://github.com/user-attachments/assets/20644c79-7afe-46ca-99c8-a9fb094bc9ea' width='325'>
<img src='https://github.com/user-attachments/assets/a40280eb-7cc7-4d3f-b798-76efb6a1dcbb' width='325'>
<img src='https://github.com/user-attachments/assets/8a7f1fd8-14fc-467b-bd13-2f927bbd9d51' width='325'>

<img src='https://github.com/user-attachments/assets/8ac4810f-4538-4647-a48a-6edd58aabdde' width='325'>
<img src='https://github.com/user-attachments/assets/c03d95dc-9b07-4b71-af08-a868d1777af1' width='325'>

[^1]: I'm relatively happy with this program's success rate. It correctly identifies cards most of the time, but there's definitely room for improvement. If the image resolution is low, lighting is poor, cards are touching or obscurred, the background is unusual, or glare is prevalent, the cards may not be identified correctly (and so neither will the sets).

[^2]: You can also view the printed-page output for this example at [examples/exampleoutput.pdf](examples/exampleoutput.pdf).
