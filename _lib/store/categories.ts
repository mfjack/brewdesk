import { readStore, updateStore, writeStore } from "./storage";

export const categoryStore = {
  getCategories: () => {
    return readStore().categories;
  },

  createCategory: (name: string) => {
    const category = {
      id: 0,
      name: name.trim(),
    };

    updateStore((data) => {
      category.id = data.nextIds.category++;

      data.categories.push(category);
    });

    return category;
  },

  updateCategory: (categoryId: number, name: string) => {
    const data = readStore();

    const category = data.categories.find((item) => item.id === categoryId);

    if (!category) {
      throw new Error("Categoria não encontrada");
    }

    category.name = name.trim();

    data.products.forEach((product) => {
      if (product.category.id === categoryId) {
        product.category = category;
      }
    });

    writeStore(data);

    return category;
  },

  deleteCategory: (categoryId: number) => {
    updateStore((data) => {
      data.categories = data.categories.filter((category) => category.id !== categoryId);

      data.products = data.products.filter((product) => product.category.id !== categoryId);
    });
  },
};
