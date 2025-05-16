import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FrontNavbarComponent } from '../../components/front-navbar/front-navbar.component';

@Component({
  selector: 'app-store-front',
  imports: [RouterOutlet, FrontNavbarComponent],
  templateUrl: './store-front.component.html',
})
export class StoreFrontComponent {}
