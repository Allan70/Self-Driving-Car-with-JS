# Self-Driving-Car-with-JS
An AI model built with JavaScript to drive 2D game vehicles
 
The vehicle is equipped with sensors in form of 5 yellow lines that will detect oncoming traffic. 
as shown below.

![image](https://user-images.githubusercontent.com/38012860/185760418-d83c9c4c-e705-4108-8306-56dcb85105df.png)

You can observe the vehicle while noting positive interactions such as when it successfully overtakes another vehicle.


💾
🚮
![image](https://user-images.githubusercontent.com/38012860/185760599-18cc094e-3717-4ed5-b1c3-2a162cf9f5e9.png)

The above two buttons are the save button and the delete button. When the vehicle makes a positive change relative to the road it will be saved and a mutated fuction of the model will be reproduced for future training.


### Weight library and driving controls

Open `index.html` in a browser. Weight snapshots are stored locally in that browser and include the full network architecture. A previous `bestBrain` save is imported automatically.

- **Save current vehicle weights** records the displayed car's exact weights under a name and timestamp.
- Choose a snapshot and click **Apply selected live** to replace the cars' networks without resetting positions. Collided cars stay stopped until restart.
- **Restart with chosen weights** resets vehicles and traffic. Car #1 receives the exact chosen weights; the other 599 candidates receive 10% mutations. The running list identifies the displayed car's source and variant.
- Choose **Manual driving** to drive the displayed vehicle using arrow keys or WASD. Other training cars pause; traffic continues. The output neurons still show the network's suggestions, while Vehicle controls shows your actual input.
- Add or remove hidden layers and set 1–16 neurons per layer, then click **Apply architecture live**. Up to five hidden layers are supported, including an architecture without hidden layers. Matching weights and thresholds are retained; new connections are randomized. Save the result to persist it.
- Toggle **Show hidden layers** to simplify the view. Scroll the network horizontally for larger architectures; hover or tap neurons and connections to inspect values.

Training here explores mutated networks and follows the vehicle furthest along the road; it does not use backpropagation. Save successful candidates to retain progress.
