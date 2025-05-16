import { Component, inject } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { ProductsService } from '@products/services/products.service';
import { map } from 'rxjs';
import { ProductCardComponent } from '../../components/product-card/product-card.component';
import { PaginationService } from '@shared/components/pagination/pagination.service';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-gender-page',
  imports: [ProductCardComponent, PaginationComponent],
  templateUrl: './gender-page.component.html',
})
export class GenderPageComponent {
  productsService = inject(ProductsService);
  route = inject(ActivatedRoute);
  paginationService = inject(PaginationService);

  gender = toSignal<string>(
    this.route.params.pipe(map(({ gender }) => gender))
  );

  productsResource = rxResource({
    request: () => ({
      gender: this.gender(),
      page: this.paginationService.currentPage() - 1,
    }),
    loader: ({ request }) => {
      return this.productsService.getProducts({
        offset: request.page * 12,
        gender: request.gender,
      });
    },
  });
}
