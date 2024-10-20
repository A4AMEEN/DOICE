import { Component, OnInit, ViewChild, ElementRef, HostListener } from '@angular/core';

@Component({
  selector: 'app-super', // Make sure this matches the selector in your template
  template: '<canvas #gameCanvas></canvas>',
  styles: ['canvas { border: 1px solid black; }']
})
export class SupermarioComponent implements OnInit {
  @ViewChild('gameCanvas', { static: true }) 
  private canvas: ElementRef<HTMLCanvasElement>;
  private ctx: CanvasRenderingContext2D;
  private player: { x: number, y: number, width: number, height: number };
  private ground: { y: number };
  private obstacles: { x: number, y: number, width: number, height: number }[];
  private jumping: boolean = false;
  private gravity: number = 0.5;
  private jumpStrength: number = 10;
  private velocityY: number = 0;

  ngOnInit() {
    this.initializeGame();
    this.gameLoop();
  }

  private initializeGame() {
    this.ctx = this.canvas.nativeElement.getContext('2d');
    this.canvas.nativeElement.width = 800;
    this.canvas.nativeElement.height = 400;

    this.player = { x: 50, y: 300, width: 30, height: 30 };
    this.ground = { y: 350 };
    this.obstacles = [
      { x: 300, y: 320, width: 50, height: 30 },
      { x: 500, y: 300, width: 50, height: 50 },
    ];
  }

  private gameLoop() {
    this.update();
    this.draw();
    requestAnimationFrame(() => this.gameLoop());
  }

  private update() {
    if (this.jumping) {
      this.player.y += this.velocityY;
      this.velocityY += this.gravity;

      if (this.player.y + this.player.height >= this.ground.y) {
        this.player.y = this.ground.y - this.player.height;
        this.jumping = false;
        this.velocityY = 0;
      }
    }
  }

  private draw() {
    this.ctx.clearRect(0, 0, this.canvas.nativeElement.width, this.canvas.nativeElement.height);
    
    // Draw ground
    this.ctx.fillStyle = 'green';
    this.ctx.fillRect(0, this.ground.y, this.canvas.nativeElement.width, this.canvas.nativeElement.height - this.ground.y);
    
    // Draw player
    this.ctx.fillStyle = 'red';
    this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
    
    // Draw obstacles
    this.ctx.fillStyle = 'blue';
    this.obstacles.forEach(obstacle => {
      this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    });
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    if (event.code === 'Space' && !this.jumping) {
      this.jump();
    }
  }

  private jump() {
    this.jumping = true;
    this.velocityY = -this.jumpStrength;
  }
}