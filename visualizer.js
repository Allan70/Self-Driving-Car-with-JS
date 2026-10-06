class Visualizer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.pointer = null;
        this.selectedNeuron = null;
        this.nodePositions = [];
        const locate = e => {
            const r = canvas.getBoundingClientRect();
            this.clientPointer = {x: e.clientX, y: e.clientY};
            this.pointer = {x: (e.clientX-r.left)*canvas.width/r.width, y: (e.clientY-r.top)*canvas.height/r.height};
        };
        canvas.addEventListener("pointermove", locate);
        canvas.addEventListener("pointerdown", e => {
            locate(e);
            this.selectedNeuron = this.nodePositions.find(node => Math.hypot(this.pointer.x-node.x, this.pointer.y-node.y)<24) || null;
        });
        canvas.addEventListener("pointerleave", () => this.pointer = null);
        this.labels = ["Left", "Front-left", "Front", "Front-right", "Right"];
        this.actions = ["Forward", "Left", "Right", "Reverse"];
        this.inputs = document.getElementById("inputs");
        this.decisions = document.getElementById("decisions");
        this.inputs.innerHTML = this.labels.map(s => `<div class="sensor"><span>${s}</span><meter min="0" max="1"></meter><output></output></div>`).join("");
        this.decisions.innerHTML = this.actions.map(s => `<div class="decision">${s}: <strong>OFF</strong></div>`).join("");
        this.motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    }
    drawNetwork(car, time, id) {
        const ctx = this.ctx, levels = car.brain.levels;
        const layers = [levels[0].inputs, ...levels.map(l => l.outputs)];
        const showHidden = document.getElementById("showHidden").checked;
        this.canvas.width = Math.max(760, layers.length * 220);
        this.canvas.height = Math.max(380, Math.max(...layers.map(v => v.length)) * 52 + 100);
        const visibleCount = showHidden ? layers.length : 2;
        const visible = k => showHidden || k === 0 || k === layers.length - 1;
        const points = layers.map((values,k) => values.map((v,i) => ({x:110+(showHidden ? k : (k === 0 ? 0 : 1))*(this.canvas.width-230)/(visibleCount-1), y:85+i*(this.canvas.height-140)/Math.max(1,values.length-1)})));
        ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
        ctx.font = "13px system-ui"; ctx.textAlign = "center"; ctx.fillStyle = "#a9b9d0";
        points.forEach((p,k) => visible(k) && ctx.fillText(k===0 ? "SENSOR INPUTS" : k===layers.length-1 ? "CONTROLS" : "HIDDEN " + k,p[0].x,30));
        this.nodePositions = points.flatMap((nodes, layer) => visible(layer) ? nodes.map((point, index) => ({...point, layer, index})) : []);
        if (this.selectedNeuron && (!visible(this.selectedNeuron.layer) || layers[this.selectedNeuron.layer]?.[this.selectedNeuron.index] === undefined)) this.selectedNeuron = null;
        let inspected = this.selectedNeuron;
        let hovered = null;
        let detail = "Hover a neuron for its live calculation. Tap/click to pin it; tap empty space to clear.";
        levels.forEach((level,k) => level.weights.forEach((weights,i) => weights.forEach((w,j) => {
            if (!visible(k) || !visible(k+1)) return;
            const a=points[k][i], b=points[k+1][j], signal=level.inputs[i]*w;
            const color=w>=0 ? "#4de0bd" : "#fb91ad";
            ctx.strokeStyle=color; ctx.globalAlpha=0.15+Math.abs(w)*0.5; ctx.lineWidth=0.5+Math.abs(w)*2.5;
            ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke();
            if(Math.abs(signal)>0.01 && !this.motion.matches) {
                const t=(time/1400+i*0.13+j*0.07+k*0.25)%1;
                ctx.globalAlpha=0.8; ctx.fillStyle=color; ctx.beginPath(); ctx.arc(lerp(a.x,b.x,t),lerp(a.y,b.y,t),2+Math.abs(signal)*2,0,Math.PI*2); ctx.fill();
            }
            if(this.pointer) {
                const dx=b.x-a.x,dy=b.y-a.y;
                const t=Math.max(0,Math.min(1,((this.pointer.x-a.x)*dx+(this.pointer.y-a.y)*dy)/(dx*dx+dy*dy)));
                if(Math.hypot(this.pointer.x-lerp(a.x,b.x,t),this.pointer.y-lerp(a.y,b.y,t))<5)
                    detail=`Layer ${k+1}, ${i+1} → ${j+1}: weight ${w.toFixed(3)} × input ${level.inputs[i].toFixed(3)} = ${signal.toFixed(3)}`;
            }
        })));
        ctx.globalAlpha=1;
        layers.forEach((values,k) => values.forEach((v,i) => {
            if (!visible(k)) return;
            const p=points[k][i], active=v>0;
            if(active) {
                const pulse=this.motion.matches ? 0 : (Math.sin(time/180+i)+1)*3;
                ctx.fillStyle="rgba(77,224,189,0.18)"; ctx.beginPath(); ctx.arc(p.x,p.y,22+pulse,0,Math.PI*2); ctx.fill();
            }
            ctx.beginPath(); ctx.arc(p.x,p.y,18,0,Math.PI*2); ctx.fillStyle=active ? "#4de0bd" : "#203048"; ctx.fill();
            const selected = this.selectedNeuron?.layer === k && this.selectedNeuron?.index === i;
            ctx.strokeStyle=selected ? "#ffffff" : active ? "#98f7df" : "#52657f"; ctx.lineWidth=selected ? 4 : 2; ctx.stroke();
            ctx.fillStyle=active ? "#092d25" : "#b9c9df"; ctx.font="bold 12px system-ui"; ctx.textAlign="center";
            ctx.fillText(k===0 ? v.toFixed(2) : String(v),p.x,p.y+4);
            ctx.fillStyle="#a9b9d0"; ctx.font="12px system-ui";
            if(k===0) {ctx.textAlign="right";ctx.fillText(this.labels[i],p.x-28,p.y+4);}
            if(k===layers.length-1) {ctx.textAlign="left";ctx.fillText(this.actions[i],p.x+28,p.y+4);}
            if(this.pointer && Math.hypot(this.pointer.x-p.x,this.pointer.y-p.y)<24) {
                hovered = {layer:k,index:i};
                inspected = hovered;
            }
        }));
        let summary = "";
        if (inspected) {
            const {layer:k,index:i} = inspected;
            const v = layers[k][i];
            if (k === 0) {
                const r = car.sensor.readings[i];
                summary = `${this.labels[i]} sensor · input ${v.toFixed(3)}`;
                detail = `${summary}\n${r ? `Hit distance = ${r.offset.toFixed(3)} × ${car.sensor.rayLength} = ${(r.offset*car.sensor.rayLength).toFixed(2)} px\nInput = 1 − offset = 1 − ${r.offset.toFixed(3)} = ${v.toFixed(3)}` : "No obstacle within range → input = 0"}`;
            } else {
                const l = levels[k-1];
                const title = k === layers.length-1 ? `${this.actions[i]} output` : `Hidden layer ${k}, neuron ${i+1}`;
                const terms = l.inputs.map((input,j) => {
                    const label = k === 1 ? this.labels[j] : `Layer ${k-1} neuron ${j+1}`;
                    return `${label}: ${input.toFixed(4)} × ${l.weights[j][i].toFixed(4)} = ${(input*l.weights[j][i]).toFixed(4)}`;
                });
                const sum = l.sums[i], threshold = l.biases[i];
                summary = `${title}\nΣ = ${sum.toFixed(4)} · threshold = ${threshold.toFixed(4)}\n${sum.toFixed(4)} ${sum>threshold ? ">" : "≤"} ${threshold.toFixed(4)} → ${v} (${v ? "firing" : "inactive"})`;
                detail = `${title}${this.selectedNeuron?.layer === k && this.selectedNeuron?.index === i ? " · pinned" : ""}\n${terms.join("\n")}\nWeighted sum Σ = ${sum.toFixed(4)}\nThreshold = ${threshold.toFixed(4)}\nActivation: a = Σ > threshold ? 1 : 0\nResult: ${sum.toFixed(4)} ${sum>threshold ? ">" : "≤"} ${threshold.toFixed(4)} → ${v} (${v ? "firing" : "inactive"})`;
            }
        }
        const tooltip = document.getElementById("neuronTooltip");
        tooltip.hidden = !hovered;
        if (hovered && this.clientPointer) {
            tooltip.textContent = summary;
            tooltip.style.left = `${Math.max(8, Math.min(this.clientPointer.x+18, window.innerWidth-310))}px`;
            tooltip.style.top = `${Math.max(8, Math.min(this.clientPointer.y+18, window.innerHeight-130))}px`;
        }
        document.getElementById("detail").textContent=detail;
        document.getElementById("status").textContent=`Car #${id} · ${car.damaged ? "Collision — stopped" : "Live"} · Speed ${car.speed.toFixed(2)} px/frame · Distance ${Math.max(0,100-car.y).toFixed(0)} px`;
        [...this.inputs.children].forEach((row,i) => {row.querySelector("meter").value=layers[0][i];row.querySelector("output").textContent=layers[0][i].toFixed(3);});
        [...this.decisions.children].forEach((row,i) => {const on=Boolean(car.controls[["forward","left","right","reverse"][i]]);row.classList.toggle("on",on);row.querySelector("strong").textContent=on ? "ON" : "OFF";});
    }
}
