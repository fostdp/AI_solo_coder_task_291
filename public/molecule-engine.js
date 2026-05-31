const MoleculeEngine = (function() {
    const ELEMENT_DATA = {
        'H': { radius: 0.53, color: '#ffffff', mass: 1.008, covalentRadius: 0.31 },
        'C': { radius: 0.77, color: '#404040', mass: 12.011, covalentRadius: 0.77 },
        'N': { radius: 0.75, color: '#3050F8', mass: 14.007, covalentRadius: 0.75 },
        'O': { radius: 0.73, color: '#FF0D0D', mass: 15.999, covalentRadius: 0.73 },
        'S': { radius: 1.02, color: '#FFFF30', mass: 32.065, covalentRadius: 1.02 },
        'Cl': { radius: 0.99, color: '#1FF01F', mass: 35.453, covalentRadius: 0.99 },
        'P': { radius: 1.06, color: '#FF8000', mass: 30.974, covalentRadius: 1.06 },
        'F': { radius: 0.71, color: '#90E050', mass: 18.998, covalentRadius: 0.71 }
    };

    const MOLECULE_DATABASE = {
        'H2O': {
            atoms: [
                { element: 'O', x: 0, y: 0, z: 0 },
                { element: 'H', x: -0.958, y: 0.674, z: 0 },
                { element: 'H', x: 0.958, y: 0.674, z: 0 }
            ],
            bonds: [[0, 1, 1], [0, 2, 1]],
            name: '水分子'
        },
        'CO2': {
            atoms: [
                { element: 'C', x: 0, y: 0, z: 0 },
                { element: 'O', x: -1.16, y: 0, z: 0 },
                { element: 'O', x: 1.16, y: 0, z: 0 }
            ],
            bonds: [[0, 1, 2], [0, 2, 2]],
            name: '二氧化碳'
        },
        'CH4': {
            atoms: [
                { element: 'C', x: 0, y: 0, z: 0 },
                { element: 'H', x: 0.85, y: 0.85, z: 0.85 },
                { element: 'H', x: -0.85, y: -0.85, z: 0.85 },
                { element: 'H', x: -0.85, y: 0.85, z: -0.85 },
                { element: 'H', x: 0.85, y: -0.85, z: -0.85 }
            ],
            bonds: [[0, 1, 1], [0, 2, 1], [0, 3, 1], [0, 4, 1]],
            name: '甲烷'
        },
        'NH3': {
            atoms: [
                { element: 'N', x: 0, y: 0, z: 0 },
                { element: 'H', x: 0, y: 0.94, z: 0.38 },
                { element: 'H', x: -0.814, y: -0.47, z: 0.38 },
                { element: 'H', x: 0.814, y: -0.47, z: 0.38 }
            ],
            bonds: [[0, 1, 1], [0, 2, 1], [0, 3, 1]],
            name: '氨气'
        },
        'N2': {
            atoms: [
                { element: 'N', x: -0.55, y: 0, z: 0 },
                { element: 'N', x: 0.55, y: 0, z: 0 }
            ],
            bonds: [[0, 1, 3]],
            name: '氮气'
        }
    };

    const Physics = {
        harmonicVibration(atoms, temperature, time, options = {}) {
            const amplitude = Math.max(0, temperature) / 500 * 0.1;
            const frequencyBase = options.frequency || 1.0;
            const damping = options.damping || 1.0;

            return atoms.map((atom, i) => {
                const phase = atom.phase || (i * 1.3 + 0.5);
                const freq = frequencyBase * (1 + i * 0.2);
                
                return {
                    ...atom,
                    vx: Math.sin(time * freq + phase) * amplitude * damping,
                    vy: Math.cos(time * freq * 0.7 + phase) * amplitude * damping,
                    vz: Math.sin(time * freq * 0.5 + phase) * amplitude * damping
                };
            });
        },

        rotatePoint3D(x, y, z, rotationX, rotationY) {
            let x1 = x * Math.cos(rotationY) - z * Math.sin(rotationY);
            let z1 = x * Math.sin(rotationY) + z * Math.cos(rotationY);
            let y1 = y * Math.cos(rotationX) - z1 * Math.sin(rotationX);
            let z2 = y * Math.sin(rotationX) + z1 * Math.cos(rotationX);
            return { x: x1, y: y1, z: z2 };
        },

        perspectiveProject(x, y, z, scale = 80, perspective = 4) {
            const factor = perspective / (perspective + z);
            return {
                screenX: x * scale * factor,
                screenY: y * scale * factor,
                scale: factor,
                depth: z
            };
        },

        getAtomProperties(element) {
            return ELEMENT_DATA[element] || ELEMENT_DATA['C'];
        }
    };

    const Renderers = {
        AbstractRenderer: class {
            constructor(canvas, ctx) {
                this.canvas = canvas;
                this.ctx = ctx;
                this.config = {
                    backgroundColor: 'rgba(10, 22, 40, 0.3)',
                    scale: 80,
                    centerX: 0,
                    centerY: 0
                };
            }

            setup(centerX, centerY) {
                this.config.centerX = centerX;
                this.config.centerY = centerY;
                this.ctx.fillStyle = this.config.backgroundColor;
                this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            }

            render(atoms, bonds, rotationX, rotationY, time) {
                throw new Error('render() must be implemented by subclass');
            }

            projectAtom(atom, rotationX, rotationY) {
                const x = atom.x + (atom.vx || 0);
                const y = atom.y + (atom.vy || 0);
                const z = atom.z + (atom.vz || 0);
                
                const rotated = Physics.rotatePoint3D(x, y, z, rotationX, rotationY);
                const projected = Physics.perspectiveProject(
                    rotated.x, rotated.y, rotated.z, 
                    this.config.scale
                );
                
                return {
                    ...atom,
                    screenX: this.config.centerX + projected.screenX,
                    screenY: this.config.centerY + projected.screenY,
                    depth: projected.depth,
                    scale: projected.scale
                };
            }

            shadeColor(color, percent) {
                const num = parseInt(color.replace('#', ''), 16);
                const amt = Math.round(2.55 * percent);
                const R = Math.max(0, Math.min(255, (num >> 16) + amt));
                const G = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amt));
                const B = Math.max(0, Math.min(255, (num & 0x00FF) + amt));
                return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
            }
        },

        BallAndStickRenderer: class extends Renderers.AbstractRenderer {
            constructor(canvas, ctx) {
                super(canvas, ctx);
                this.config.atomScaleFactor = 15;
                this.config.bondWidth = 6;
            }

            render(atoms, bonds, rotationX, rotationY, time) {
                const projectedAtoms = atoms.map(atom => this.projectAtom(atom, rotationX, rotationY));
                
                const sortedIndices = projectedAtoms
                    .map((a, i) => i)
                    .sort((a, b) => projectedAtoms[a].depth - projectedAtoms[b].depth);

                this.renderBonds(bonds, projectedAtoms);
                this.renderAtoms(projectedAtoms, sortedIndices);
            }

            renderBonds(bonds, projectedAtoms) {
                bonds.forEach(bond => {
                    const atom1 = projectedAtoms[bond[0]];
                    const atom2 = projectedAtoms[bond[1]];
                    const bondOrder = bond[2] || 1;
                    const scale = Math.min(atom1.scale, atom2.scale);

                    const dx = atom2.screenX - atom1.screenX;
                    const dy = atom2.screenY - atom1.screenY;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    
                    if (dist < 1) return;

                    const nx = -dy / dist;
                    const ny = dx / dist;

                    const props1 = Physics.getAtomProperties(atom1.element);
                    const props2 = Physics.getAtomProperties(atom2.element);

                    const baseOffset = 4 * scale;
                    const lineWidth = Math.max(2, this.config.bondWidth * scale / bondOrder);

                    for (let i = 0; i < bondOrder; i++) {
                        const offset = (i - (bondOrder - 1) / 2) * baseOffset;
                        const x1 = atom1.screenX + nx * offset;
                        const y1 = atom1.screenY + ny * offset;
                        const x2 = atom2.screenX + nx * offset;
                        const y2 = atom2.screenY + ny * offset;

                        const gradient = this.ctx.createLinearGradient(x1, y1, x2, y2);
                        gradient.addColorStop(0, props1.color);
                        gradient.addColorStop(1, props2.color);

                        this.ctx.strokeStyle = gradient;
                        this.ctx.lineWidth = lineWidth;
                        this.ctx.lineCap = 'round';
                        this.ctx.beginPath();
                        this.ctx.moveTo(x1, y1);
                        this.ctx.lineTo(x2, y2);
                        this.ctx.stroke();
                    }
                });
            }

            renderAtoms(projectedAtoms, sortedIndices) {
                sortedIndices.forEach(idx => {
                    const atom = projectedAtoms[idx];
                    const props = Physics.getAtomProperties(atom.element);
                    const size = props.radius * this.config.atomScaleFactor * atom.scale;
                    
                    const gradient = this.ctx.createRadialGradient(
                        atom.screenX - size * 0.3, atom.screenY - size * 0.3, 0,
                        atom.screenX, atom.screenY, size
                    );
                    gradient.addColorStop(0, '#ffffff');
                    gradient.addColorStop(0.3, props.color);
                    gradient.addColorStop(1, this.shadeColor(props.color, -40));

                    this.ctx.fillStyle = gradient;
                    this.ctx.beginPath();
                    this.ctx.arc(atom.screenX, atom.screenY, size, 0, Math.PI * 2);
                    this.ctx.fill();

                    this.ctx.fillStyle = '#fff';
                    this.ctx.font = `bold ${Math.max(10, size * 0.6)}px Arial`;
                    this.ctx.textAlign = 'center';
                    this.ctx.textBaseline = 'middle';
                    this.ctx.fillText(atom.element, atom.screenX, atom.screenY);
                });
            }
        },

        SpaceFillingRenderer: class extends Renderers.AbstractRenderer {
            constructor(canvas, ctx) {
                super(canvas, ctx);
                this.config.atomScaleFactor = 40;
            }

            render(atoms, bonds, rotationX, rotationY, time) {
                const projectedAtoms = atoms.map(atom => this.projectAtom(atom, rotationX, rotationY));
                
                const sortedIndices = projectedAtoms
                    .map((a, i) => i)
                    .sort((a, b) => projectedAtoms[a].depth - projectedAtoms[b].depth);

                this.renderAtoms(projectedAtoms, sortedIndices);
            }

            renderAtoms(projectedAtoms, sortedIndices) {
                sortedIndices.forEach(idx => {
                    const atom = projectedAtoms[idx];
                    const props = Physics.getAtomProperties(atom.element);
                    const size = props.radius * this.config.atomScaleFactor * atom.scale;
                    const depthFactor = 1 - (atom.depth + 3) / 6;
                    const adjustedSize = size * Math.max(0.5, depthFactor);
                    
                    const gradient = this.ctx.createRadialGradient(
                        atom.screenX - adjustedSize * 0.2, 
                        atom.screenY - adjustedSize * 0.2, 0,
                        atom.screenX, atom.screenY, adjustedSize
                    );
                    gradient.addColorStop(0, this.shadeColor(props.color, 30));
                    gradient.addColorStop(0.5, props.color);
                    gradient.addColorStop(1, this.shadeColor(props.color, -50));

                    this.ctx.fillStyle = gradient;
                    this.ctx.beginPath();
                    this.ctx.arc(atom.screenX, atom.screenY, adjustedSize, 0, Math.PI * 2);
                    this.ctx.fill();

                    this.ctx.strokeStyle = 'rgba(255,255,255,0.1)';
                    this.ctx.lineWidth = 1;
                    this.ctx.stroke();

                    this.ctx.fillStyle = '#fff';
                    this.ctx.font = `bold ${Math.max(8, adjustedSize * 0.3)}px Arial`;
                    this.ctx.textAlign = 'center';
                    this.ctx.textBaseline = 'middle';
                    this.ctx.fillText(atom.element, atom.screenX, atom.screenY);
                });
            }
        },

        WireframeRenderer: class extends Renderers.AbstractRenderer {
            constructor(canvas, ctx) {
                super(canvas, ctx);
            }

            render(atoms, bonds, rotationX, rotationY, time) {
                const projectedAtoms = atoms.map(atom => this.projectAtom(atom, rotationX, rotationY));
                
                this.ctx.strokeStyle = '#00d4ff';
                this.ctx.lineWidth = 1;
                
                bonds.forEach(bond => {
                    const atom1 = projectedAtoms[bond[0]];
                    const atom2 = projectedAtoms[bond[1]];
                    
                    this.ctx.beginPath();
                    this.ctx.moveTo(atom1.screenX, atom1.screenY);
                    this.ctx.lineTo(atom2.screenX, atom2.screenY);
                    this.ctx.stroke();
                });

                projectedAtoms.forEach(atom => {
                    const size = 4 * atom.scale;
                    const props = Physics.getAtomProperties(atom.element);
                    
                    this.ctx.strokeStyle = props.color;
                    this.ctx.lineWidth = 2;
                    this.ctx.beginPath();
                    this.ctx.arc(atom.screenX, atom.screenY, size, 0, Math.PI * 2);
                    this.ctx.stroke();
                });
            }
        }
    };

    const MoleculeState = {
        create(formula) {
            const template = MOLECULE_DATABASE[formula];
            if (!template) return null;

            return {
                formula,
                name: template.name,
                atoms: template.atoms.map((atom, i) => ({
                    ...atom,
                    vx: 0,
                    vy: 0,
                    vz: 0,
                    phase: i * 1.3 + Math.random() * 0.5
                })),
                bonds: [...template.bonds]
            };
        },

        update(state, temperature, time) {
            if (!state) return state;
            return {
                ...state,
                atoms: Physics.harmonicVibration(state.atoms, temperature, time)
            };
        },

        getSupportedFormulas() {
            return Object.keys(MOLECULE_DATABASE);
        }
    };

    return {
        Physics,
        Renderers,
        MoleculeState,
        ELEMENT_DATA,
        MOLECULE_DATABASE
    };
})();
