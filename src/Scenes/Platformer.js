class Platformer extends Phaser.Scene {
    constructor() {
        super("platformerScene");
    }

    init() {
        // variables and settings
        this.ACCELERATION = 250;
        this.DRAG = 750;    // DRAG < ACCELERATION = icy slide
        this.physics.world.gravity.y = 1450;
        this.JUMP_VELOCITY = -500;
        this.PARTICLE_VELOCITY = 10;
        this.SCALE = 2.0;
        this.currScore = 0
        this.keyGet = false;
    }

    create() {
        // Create a new tilemap game object which uses 18x18 pixel tiles, and is
        // 135 tiles wide and 25 tiles tall.
        this.map = this.add.tilemap("Nature-Pipe-Dreams", 18, 18, 135, 25);
        this.physics.world.setBounds(0,0, 135*18 , 25*18);

        // Add a tileset to the map
        // First parameter: name we gave the tileset in Tiled
        // Second parameter: key for the tilesheet (from this.load.image in Load.js)
        this.tileset = this.map.addTilesetImage("Tileset-1", "tilemap_tiles");

        // Create a layer
        this.groundLayer = this.map.createLayer("Ground-n-Platforms", this.tileset, 0, 0);

        // Make it collidable
        this.groundLayer.setCollisionByProperty({
            collides: true
        });


        this.coins = this.map.createFromObjects("Objects", {
            name: "coin",
            key: "tilemap_sheet",
            frame: 151
        });

        this.gems = this.map.createFromObjects("Objects", {
            name: "gem",
            key: "tilemap_sheet",
            frame: 67
        });

        this.endKeys = this.map.createFromObjects("Objects", {
            name: "endKey",
            key: "tilemap_sheet",
            frame: 27
        });

        this.doors = this.map.createFromObjects("Objects", {
            name: "door",
            key: "tilemap_sheet",
            frame: 130
        });


        /*my.text.sText = this.add.text(70, 10, 'Score: ' + this.currScore, {
            fontFamily: 'Times, serif',
            fontSize: 24
        });*/
        

        // Since createFromObjects returns an array of regular Sprites, we need to convert 
        // them into Arcade Physics sprites (STATIC_BODY, so they don't move) 
        this.physics.world.enable(this.coins, Phaser.Physics.Arcade.STATIC_BODY);
        this.physics.world.enable(this.gems, Phaser.Physics.Arcade.STATIC_BODY);
        this.physics.world.enable(this.endKeys, Phaser.Physics.Arcade.STATIC_BODY);
        this.physics.world.enable(this.doors, Phaser.Physics.Arcade.STATIC_BODY);

        // Create a Phaser group out of the array this.coins
        // This will be used for collision detection below.
        this.coinGroup = this.add.group(this.coins);
        this.gemGroup = this.add.group(this.gems);
        this.endKeyGroup = this.add.group(this.endKeys);
        this.doorGroup = this.add.group(this.doors);
        

        // set up player avatar
        my.sprite.player = this.physics.add.sprite(30, 345, "platformer_characters", "tile_0000.png");
        my.sprite.player.setCollideWorldBounds(true);

        // Enable collision handling
        this.physics.add.collider(my.sprite.player, this.groundLayer);

        // Handle collision detection
        this.physics.add.overlap(my.sprite.player, this.coinGroup, (obj1, obj2) => {
            obj2.destroy();
        });

        this.physics.add.overlap(my.sprite.player, this.gemGroup, (obj1, obj2) => {
            obj2.destroy();
        });

        this.physics.add.overlap(my.sprite.player, this.endKeyGroup, (obj1, obj2) => {
            obj2.keyGet = true;
            obj2.destroy();
        });

        this.physics.add.overlap(my.sprite.player, this.dooorGroup, (obj1, obj2) => {
            obj2.destroy();
        });

        //this.load.audio('jumpSFX', 'assets/phaserUp3.ogg');
        //jumpMusic = this.sound.add("jumpSFX");

        // set up Phaser-provided cursor key input
        cursors = this.input.keyboard.createCursorKeys();

        this.rKey = this.input.keyboard.addKey('R');

        /* debug key listener (assigned to D key)
        this.input.keyboard.on('keydown-D', () => {
            this.physics.world.drawDebug = this.physics.world.drawDebug ? false : true
            this.physics.world.debugGraphic.clear()
        }, this); */
        this.physics.world.drawDebug = this.physics.world.drawDebug ? false : true
        this.physics.world.debugGraphic.clear()

        // movement vfx

        my.vfx.walking = this.add.particles(0, 0, "kenny-particles", {
            frame: ['muzzle_02.png', 'muzzle_05.png'],
            random: true,
            scale: {start: 0.03, end: 0.1},
            maxAliveParticles: 8,
            lifespan: 200,
            gravityY: -400,
            alpha: {start: 1, end: 0.1}, 
        });

        my.vfx.walking.stop();
        
        my.vfx.jumping = this.add.particles(0, 0, "kenny-particles", {
            frame: ['muzzle_03.png', 'muzzle_04.png'],
            random: true,
            scale: {start: 0.03, end: 0.1},
            maxAliveParticles: 5,
            lifespan: 100,
            gravityY: -400,
            alpha: {start: 1, end: 0.1}, 
        });

        my.vfx.jumping.stop();

        my.vfx.win = this.add.particles(0, 0, "kenny-particles", {
            frame: ['star_07.png', 'star_08.png'],
            random: true,
            scale: {start: 0.05, end: 0.15},
            maxAliveParticles: 8,
            lifespan: 500,
            gravityY: -400,
            alpha: {start: 1, end: 0.1}, 
        });

        my.vfx.win.stop();

        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.cameras.main.startFollow(my.sprite.player, true, 0.25, 0.25); // (target, [,roundPixels][,lerpX][,lerpY])
        this.cameras.main.setDeadzone(50, 50);
        this.cameras.main.setZoom(this.SCALE);

    }

    update() {
        if(cursors.left.isDown) {
            my.sprite.player.setAccelerationX(-this.ACCELERATION);
            my.sprite.player.resetFlip();
            my.sprite.player.anims.play('walk', true);
            my.vfx.walking.startFollow(my.sprite.player, my.sprite.player.displayWidth/2-10, my.sprite.player.displayHeight/2-5, false);
            my.vfx.walking.setParticleSpeed(this.PARTICLE_VELOCITY, 0);
            // Only play smoke effect if touching the ground
            if (my.sprite.player.body.blocked.down) {
                my.vfx.walking.start();
            }

        } else if(cursors.right.isDown) {
            my.sprite.player.setAccelerationX(this.ACCELERATION);
            my.sprite.player.setFlip(true, false);
            my.sprite.player.anims.play('walk', true);
            my.vfx.walking.startFollow(my.sprite.player, my.sprite.player.displayWidth/2-15, my.sprite.player.displayHeight/2-5, false);
            my.vfx.walking.setParticleSpeed(-this.PARTICLE_VELOCITY, 0);
            // Only play smoke effect if touching the ground
            if (my.sprite.player.body.blocked.down) {
                my.vfx.walking.start();
            }

        } else {
            // Set acceleration to 0 and have DRAG take over
            my.sprite.player.setAccelerationX(0);
            my.sprite.player.setDragX(this.DRAG);
            my.sprite.player.anims.play('idle');
            my.vfx.walking.stop();
        }

        // player jump
        // note that we need body.blocked rather than body.touching b/c the former applies to tilemap tiles and the latter to the "ground"
        if(!my.sprite.player.body.blocked.down) {
            my.sprite.player.anims.play('jump');
            my.vfx.jumping.start()
            my.vfx.jumping.startFollow(my.sprite.player, my.sprite.player.displayWidth/2-10, my.sprite.player.displayHeight/2-5, false);
            my.vfx.jumping.setParticleSpeed(this.PARTICLE_VELOCITY, 0);
        }
        
        else {
            my.vfx.jumping.stop();
        }

        if(my.sprite.player.body.blocked.down && Phaser.Input.Keyboard.JustDown(cursors.up)) {
            my.sprite.player.body.setVelocityY(this.JUMP_VELOCITY);
            this.sound.play(`jumpSFX`);
            //jumpMusic.play();
        }

        /*if(Phaser.Input.Keyboard.JustDown(this.rKey)) {
            this.scene.restart();
        }*/

        if (my.sprite.player.y >= 400) {
            this.scene.restart();
        }

        if (my.sprite.player.x >= 1538 && my.sprite.player.y == 258) {
            my.sprite.player.keyGet = true;
        }

        if (my.sprite.player.x == 2364 && my.sprite.player.y == 258 && my.sprite.player.keyGet == true) {   
            my.vfx.win.start()
            my.vfx.win.startFollow(my.sprite.player, my.sprite.player.displayWidth/2-10, my.sprite.player.displayHeight/2-5, false);
            my.vfx.win.setParticleSpeed(this.PARTICLE_VELOCITY, 0);
            this.timedEvent = this.time.delayedCall(3000, this.winEvent, [], this);
        }
    }

    winEvent() {
        this.scene.restart();
    }

    /*updateText() {
        let my = this.my;
        my.text.sText.setText("Score: " + this.currScore);
    };*/
}