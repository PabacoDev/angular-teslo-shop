import { Component, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { ProductsService } from '@products/services/products.service';
import { ProductCarouselComponent } from '../../components/product-carousel/product-carousel.component';

@Component({
  selector: 'app-product-page',
  imports: [ProductCarouselComponent],
  templateUrl: './product-page.component.html',
})
export class ProductPageComponent {
  activatedRoute = inject(ActivatedRoute);
  productService = inject(ProductsService);

  prodcutIdSlug: string = this.activatedRoute.snapshot.params['idSlug'];

  productResource = rxResource({
    request: () => ({ idSlug: this.prodcutIdSlug }),
    loader: ({ request }) => {
      return this.productService.getProductById(request.idSlug);
    },
  });
}
