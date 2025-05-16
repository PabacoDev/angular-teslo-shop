import {
  Component,
  computed,
  inject,
  input,
  OnInit,
  signal,
} from '@angular/core';
import { Product } from '@products/interfaces/product.interface';
import { ProductCarouselComponent } from '../../../../products/components/product-carousel/product-carousel.component';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormUtils } from '@utils/form-utils';
import { FormErrorComponent } from '../../../../shared/components/form-error/form-error.component';
import { ProductsService } from '@products/services/products.service';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'product-details',
  imports: [ProductCarouselComponent, ReactiveFormsModule, FormErrorComponent],
  templateUrl: './product-details.component.html',
})
export class ProductDetailsComponent implements OnInit {
  product = input.required<Product>();
  productService = inject(ProductsService);
  router = inject(Router);
  wasSaved = signal(false);

  fb = inject(FormBuilder);

  imageFileList: FileList | undefined = undefined;
  tempImages = signal<string[]>([]);

  imagesToCarrousel = computed(() => [
    ...this.product().images,
    ...this.tempImages(),
  ]);

  productForm = this.fb.group({
    title: ['', Validators.required],
    description: ['', Validators.required],
    slug: [
      '',
      [Validators.required, Validators.pattern(FormUtils.slugPattern)],
    ],
    price: [0, [Validators.required, Validators.min(0)]],
    stock: [0, [Validators.required, Validators.min(0)]],
    sizes: [['']],
    images: [[]],
    tags: [''],
    gender: [
      'men',
      [Validators.required, Validators.pattern(/men|women|kid|unisex/)],
    ],
  });

  sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

  ngOnInit(): void {
    this.setFormValue(this.product());
  }

  setFormValue(formLike: Partial<Product>) {
    this.productForm.reset(this.product() as any);
    this.productForm.patchValue({ tags: formLike.tags?.join(', ') });
  }

  async onSubmit() {
    const isValid = this.productForm.valid;
    this.productForm.markAllAsTouched();
    if (!isValid) return;

    const formValue = this.productForm.value;

    const productLike: Partial<Product> = {
      ...(formValue as any),
      tags:
        formValue.tags
          ?.toLowerCase()
          .split(', ')
          .map((tag) => tag.trim()) ?? [],
    };

    if (this.product().id == 'new') {
      const product = await firstValueFrom(
        this.productService.createProduct(productLike)
      );
      this.productService
        .createProduct(productLike, this.imageFileList)
        .subscribe();
      this.router.navigate(['/admin/products', product.id]);
      this.wasSaved.set(true);
    } else {
      await firstValueFrom(
        this.productService.updateProduct(
          this.product().id,
          productLike,
          this.imageFileList
        )
      );
    }
    this.wasSaved.set(true);
    setTimeout(() => {
      this.wasSaved.set(true);
    }, 3000);
  }

  onSizeChange(size: string) {
    const currentSizes = this.productForm.value.sizes ?? [];

    if (currentSizes.includes(size)) {
      currentSizes.splice(currentSizes.indexOf(size), 1);
    } else {
      currentSizes.push(size);
    }
    this.productForm.patchValue({ sizes: currentSizes });
  }

  onFilesChange(event: Event) {
    const fileList = (event.target as HTMLInputElement).files;
    this.imageFileList = fileList ?? undefined;
    const imageUrls = Array.from(fileList ?? []).map((file) =>
      URL.createObjectURL(file)
    );
    this.tempImages.set(imageUrls);
  }
}
