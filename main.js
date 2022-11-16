const carCanvas = document.getElementById("carCanvas");
carCanvas.width = 200;
const networkCanvas = document.getElementById("networkCanvas");
networkCanvas.width = 300;

const carCtx = carCanvas.getContext("2d");
const networkCtx = networkCanvas.getContext("2d");

const road = new Road(carCanvas.width / 2, carCanvas.width * 0.9);
const N = 600;
const cars = generateCars(N)
let bestCar = cars[0];

if (localStorage.getItem("bestBrain")) {
    for (let i = 0; i < cars.length; i++) {

        cars[i].brain = JSON.parse(
            localStorage.getItem("bestBrain"));
        if(i!=0){
            NeuralNetwork.mutate(cars[i].brain, 0.1)
        }
    }

}

const traffic = [
    new Car(road.getLaneCenter(0), -100, 30, 50, "DUMMY", 2),
    new Car(road.getLaneCenter(2), -300, 30, 50, "DUMMY", 2),
    new Car(road.getLaneCenter(0), -300, 30, 50, "DUMMY", 2),
    new Car(road.getLaneCenter(1), -400, 30, 50, "DUMMY", 2),
    new Car(road.getLaneCenter(2), -600, 30, 50, "DUMMY", 2),
    new Car(road.getLaneCenter(0), -600, 30, 50, "DUMMY", 2),
    new Car(road.getLaneCenter(1), -800, 30, 50, "DUMMY", 2),
    new Car(road.getLaneCenter(2), -1000, 30, 50, "DUMMY", 2),
    new Car(road.getLaneCenter(1), -1000, 30, 50, "DUMMY", 2),
    new Car(road.getLaneCenter(0), -1500, 30, 50, "DUMMY", 2),
    new Car(road.getLaneCenter(2), -1700, 30, 50, "DUMMY", 2),
    new Car(road.getLaneCenter(1), -1900, 30, 50, "DUMMY", 2),
    new Car(road.getLaneCenter(0), -1900, 30, 50, "DUMMY", 2),
    new Car(road.getLaneCenter(2), -2300, 30, 50, "DUMMY", 2),
    new Car(road.getLaneCenter(1), -2500, 30, 50, "DUMMY", 2),
    new Car(road.getLaneCenter(0), -2900, 30, 50, "DUMMY", 2),
    new Car(road.getLaneCenter(2), -3300, 30, 50, "DUMMY", 2),
    new Car(road.getLaneCenter(1), -3300, 30, 50, "DUMMY", 2),
    new Car(road.getLaneCenter(0), -3600, 30, 50, "DUMMY", 2),
    new Car(road.getLaneCenter(2), -3600, 30, 50, "DUMMY", 2),
    new Car(road.getLaneCenter(1), -3900, 30, 50, "DUMMY", 2),
    new Car(road.getLaneCenter(0), -4300, 30, 50, "DUMMY", 2),
    new Car(road.getLaneCenter(0), -4700, 30, 50, "DUMMY", 2),
    new Car(road.getLaneCenter(2), -4700, 30, 50, "DUMMY", 2),
    new Car(road.getLaneCenter(1), -4900, 30, 50, "DUMMY", 2),
    new Car(road.getLaneCenter(0), -4900, 30, 50, "DUMMY", 2),
    new Car(road.getLaneCenter(2), -5300, 30, 50, "DUMMY", 2),
    new Car(road.getLaneCenter(1), -5500, 30, 50, "DUMMY", 2),
    new Car(road.getLaneCenter(0), -5900, 30, 50, "DUMMY", 2),
    new Car(road.getLaneCenter(2), -6300, 30, 50, "DUMMY", 2),
    new Car(road.getLaneCenter(1), -6300, 30, 50, "DUMMY", 2),
    new Car(road.getLaneCenter(0), -6600, 30, 50, "DUMMY", 2),
    new Car(road.getLaneCenter(2), -6600, 30, 50, "DUMMY", 2),
    new Car(road.getLaneCenter(1), -6900, 30, 50, "DUMMY", 2),
    new Car(road.getLaneCenter(0), -7300, 30, 50, "DUMMY", 2),
]

animate();

function save() {
    localStorage.setItem("bestBrain", JSON.stringify(bestCar.brain));
}

function discard() {
    localStorage.removeItem("bestBrain")
}

function generateCars(N) {
    const cars = [];
    for (let i = 1; i < N; i++) {
        cars.push(new Car(road.getLaneCenter(1), 100, 30, 50, "AI"))
    }
    return cars;
}

function animate() {
    for (let i = 0; i < traffic.length; i++) {
        traffic[i].update(road.borders, []);
    }

    for (let i = 0; i < cars.length; i++) {
        cars[i].update(road.borders, traffic);
    }
    bestCar = cars.find(
        // Find the car whose y value is the minimum value of all the y values
        c => c.y == Math.min(...cars.map(c => c.y))
    )

    carCanvas.height = window.innerHeight;
    networkCanvas.height = window.innerHeight;

    carCtx.save();
    carCtx.translate(0, -bestCar.y + carCanvas.height * 0.7)

    road.draw(carCtx);
    for (let i = 0; i < traffic.length; i++) {
        traffic[i].draw(carCtx, "yellow");
    }

    carCtx.globalAlpha = 0.2;
    for (let i = 0; i < cars.length; i++) {
        cars[i].draw(carCtx, "blue");
    }
    carCtx.globalAlpha = 1;
    bestCar.draw(carCtx, "blue", true)
    carCtx.restore();

    // Visualizer.drawNetwork(networkCtx,car.brain);
    requestAnimationFrame(animate);
}
